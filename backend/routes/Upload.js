const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const XLSX = require("xlsx");
const pdfParse = require("pdf-parse");
const crypto = require("crypto");

const { aiExtractTransactions } = require("../ai/aiExtractTransactions");
const Transaction = require("../models/Transaction");
const Card = require("../models/Card");

const categorize = require("../utils/categorize");
const { aiCategorize } = require("../ai/aiCategorize");
const AICategoryCache = require("../models/AICategoryCache");
const normalizeMerchant = require("../utils/normalizeMerchant");
const { shouldEscalateModel } = require("../utils/shouldEscalateModel");

const auth = require("../middleware/auth");
const loadUser = require("../middleware/loadUser");

const router = express.Router();

function resetDailyPreviewCounter(user) {
  const today = new Date().toDateString();

  if (!user.lastPreviewDate || user.lastPreviewDate.toDateString() !== today) {
    user.previewUploadsToday = 0;
    user.lastPreviewDate = new Date();
  }
}

/* =========================
   FILE UPLOAD CONFIG
========================= */
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const name = file.originalname.toLowerCase();
    if (
      name.endsWith(".csv") ||
      name.endsWith(".xls") ||
      name.endsWith(".xlsx") ||
      name.endsWith(".pdf")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV, Excel, or PDF files allowed"));
    }
  }
});

/* =========================
   FREE PLAN UPLOAD LIMIT
   - Free: 1 upload / day
   - Pro: unlimited
========================= */
async function canUploadToday(user) {
  const plan = user.plan || "free";
  if (plan !== "free") return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const uploadsToday = await Transaction.countDocuments({
    userId: user._id,
    source: "upload",
    createdAt: { $gte: today }
  });

  return uploadsToday < 1;
}

/* =========================
   PDF PARSER (SAFE)
========================= */
async function parsePDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const pdf = await pdfParse(buffer);
  const text = pdf.text;

  if (!text || text.trim().length < 50) {
    throw new Error(
      "This PDF does not contain extractable text. Scanned PDFs are not supported."
    );
  }

  const miniRows = await aiExtractTransactions(text, "gpt-4o-mini");

  if (!Array.isArray(miniRows) || miniRows.length === 0) {
    return await aiExtractTransactions(text, "gpt-4o");
  }

  if (!shouldEscalateModel(text, miniRows)) return miniRows;

  const strongRows = await aiExtractTransactions(text, "gpt-4o");
  return Array.isArray(strongRows) && strongRows.length ? strongRows : miniRows;
}

/* =========================
   CATEGORY RESOLUTION
========================= */
async function resolveCategory(description) {
  const result = categorize(description);

  if (
    result.category === "UNKNOWN" ||
    result.category === "Other" ||
    result.confidence < 0.5
  ) {
    const merchantKey = normalizeMerchant(description);
    const cached = await AICategoryCache.findOne({ merchantKey });

    if (cached) return { ...cached.toObject(), source: "ai-cache" };

    const aiCategory = (await aiCategorize(description)) || "Other";

    await AICategoryCache.create({
      merchantKey,
      category: aiCategory,
      confidence: 0.7
    });

    return { category: aiCategory, confidence: 0.7, source: "ai" };
  }

  return { ...result, source: "rule" };
}

/* =========================
   PREVIEW (PDF ONLY)
   - NO virus scan
   - Free users blocked here (no API waste)
========================= */
router.post(
  "/preview",
  auth,
  loadUser,
  upload.array("file", 10),
  async (req, res) => {
    try {
      /* =========================
         FREE PLAN PREVIEW LIMIT
      ========================= */
      if ((req.user.plan || "free") === "free") {
        resetDailyPreviewCounter(req.user);

        if (req.user.previewUploadsToday >= 1) {
          return res.status(403).json({
            upgrade: true,
            message: "Free plan allows only 1 document preview per day"
          });
        }
      }

      const preview = [];

      for (const file of req.files) {
        try {
          if (!file.originalname.toLowerCase().endsWith(".pdf")) {
            fs.unlinkSync(file.path);
            continue;
          }

          const rows = await parsePDF(file.path);

          for (const row of rows) {
            const result = await resolveCategory(row.description);
            let amount = Number(row.amount);

            if (/credit card|payment thank you|statement balance/i.test(row.description)) {
              amount = -Math.abs(amount);
            } else if (/purchase|withdrawal|fee|pos|atm/i.test(row.description)) {
              amount = -Math.abs(amount);
            } else if (/salary|deposit|refund|interest/i.test(row.description)) {
              amount = Math.abs(amount);
            }

            preview.push({
              id: crypto.randomUUID(),
              date: row.date,
              description: row.description,
              amount: Number(amount.toFixed(2)),
              category: result.category,
              confidence: result.confidence,
              selected: true
            });
          }

          fs.unlinkSync(file.path);
        } catch (fileErr) {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          console.warn("Skipping file during preview:", file.originalname, fileErr.message);
        }
      }

      if (!preview.length) {
  return res.status(400).json({
    upgrade: false,
    message: "No previewable transactions were found in the uploaded PDF(s)."
  });
}


      // ✅ Increment preview count ONLY after success
      if ((req.user.plan || "free") === "free") {
        req.user.previewUploadsToday += 1;
        await req.user.save();
      }

      res.json({ transactions: preview });
    } catch (err) {
      console.error("Preview failed:", err);
      res.status(400).json({ error: err.message });
    }
  }
);

/* =========================
   CONFIRM & SAVE
   - Free plan re-checked
   - JSON only (no virus scan needed)
========================= */
router.post("/confirm", auth, loadUser, async (req, res) => {
  try {
    const allowed = await canUploadToday(req.user);
    if (!allowed) {
      return res.status(403).json({
        upgrade: true,
        message: "Free plan allows 1 upload per day"
      });
    }

    const cleaned = (req.body.transactions || []).filter(
      t =>
        t &&
        t.date &&
        t.description &&
        typeof t.amount === "number" &&
        t.cardId &&
        t.currency
    );

    if (!cleaned.length) {
      return res.status(400).json({ error: "No valid transactions" });
    }

    const cardIds = [...new Set(cleaned.map(t => t.cardId))];
    const cards = await Card.find({
      _id: { $in: cardIds },
      userId: req.user._id
    });

    if (cards.length !== cardIds.length) {
      return res.status(403).json({
        error: "Invalid card selection"
      });
    }

    const unique = new Map();
    cleaned.forEach(t => {
      const key = `${t.date}-${t.description}-${t.amount}-${t.cardId}`;
      unique.set(key, {
        ...t,
        userId: req.user._id,
        source: "upload",
        confidence: t.confidence ?? 1
      });
    });

    await Transaction.insertMany([...unique.values()], { ordered: false });

    res.json({
      success: true,
      inserted: unique.size
    });
  } catch (err) {
    console.error("Confirm failed:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;