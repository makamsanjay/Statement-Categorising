const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const XLSX = require("xlsx");
const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");
const crypto = require("crypto");

const { aiExtractTransactions } = require("../ai/aiExtractTransactions");
const Transaction = require("../models/Transaction");
const categorize = require("../utils/categorize");
const { aiCategorize } = require("../ai/aiCategorize");
const AICategoryCache = require("../models/AICategoryCache");
const normalizeMerchant = require("../utils/normalizeMerchant");
const { scanFile } = require("../utils/virusScan");

const auth = require("../middleware/auth");
const loadUser = require("../middleware/loadUser");

const router = express.Router();

/* =========================
   FILE UPLOAD CONFIG
========================= */
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 20 * 1024 * 1024
  },
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
   (COUNT ONLY ON CONFIRM)
========================= */
function canUploadToday(user) {
  // default values (VERY IMPORTANT)
  if (typeof user.uploadsToday !== "number") {
    user.uploadsToday = 0;
  }

  if (!user.lastUploadDate) {
    user.lastUploadDate = new Date(0);
  }

  if (!user.plan) {
    user.plan = "free";
  }

  const today = new Date().toDateString();

  if (user.lastUploadDate.toDateString() !== today) {
    user.uploadsToday = 0;
    user.lastUploadDate = new Date();
  }

  return user.plan !== "free" || user.uploadsToday < 1;
}

/* =========================
   PARSERS
========================= */
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", row => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

function parseExcel(filePath) {
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
}

async function parsePDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const pdf = await pdfParse(buffer);
  let text = pdf.text;

  if (!text || text.trim().length < 50) {
    const ocr = await Tesseract.recognize(filePath, "eng");
    text = ocr.data.text;
  }

  if (!text || text.trim().length < 50) {
    throw new Error("Unable to extract text from PDF");
  }

  return {
  rows: await aiExtractTransactions(text),
  rawText: text
};

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

    const aiCategory = await aiCategorize(description) || "Other";
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
   PDF PREVIEW (NO LIMIT COUNT)
========================= */

router.post(
  "/preview",
  auth,
  loadUser,
  upload.any(),
  async (req, res) => {
    try {
      const preview = [];

      for (const file of req.files) {
        try {
          // 🔐 Virus scan
          await scanFile(file.path);

          // Only PDFs allowed
          if (!file.originalname.toLowerCase().endsWith(".pdf")) {
            fs.unlinkSync(file.path);
            continue;
          }

          // 📄 Parse PDF (OCR → AI → rows)
          const { rows, rawText } = await parsePDF(file.path);


          for (const row of rows) {
  const result = await resolveCategory(row.description);

  let amount = Number(row.amount);

  const isDebit =
    /payment to|card purchase|purchase|withdrawal|web pmts|fee|pos|atm/i.test(
      row.description
    );

  const isCredit =
    /zelle|salary|deposit|credit|refund|reimbursement|interest|real time payment/i.test(
      row.description
    );

  // 🔴 DEBITS: trust AI, force negative
  if (isDebit) {
    amount = -Math.abs(amount);
  }

  // 🟢 CREDITS: recompute from raw text (CRITICAL FIX)
  else if (isCredit) {
    // find all positive amounts near this description
    const escapedDesc = row.description.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `${escapedDesc}[\\s\\S]{0,80}?([0-9,]+\\.\\d{2})(?:\\s+([0-9,]+\\.\\d{2}))?`,
      "i"
    );

    const match = rawText.match(regex);

    if (match) {
      const nums = match
        .slice(1)
        .filter(Boolean)
        .map(n => Number(n.replace(/,/g, "")));

      // CREDIT RULE: smallest positive number is the transaction
      amount = Math.min(...nums.filter(n => n > 0));
    }

    amount = Math.abs(amount);
  }

  // Normalize decimals
  amount = Number(amount.toFixed(2));

  preview.push({
    id: crypto.randomUUID(),
    ...row,
    amount,
    category: result.category,
    confidence: result.confidence,
    selected: true
  });
}

          // Cleanup file
          fs.unlinkSync(file.path);

        } catch (fileErr) {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          return res.status(400).json({
            error: fileErr.message || "File blocked for security reasons"
          });
        }
      }

      res.json(preview);

    } catch (err) {
      console.error("Preview failed:", err);
      res.status(400).json({ error: err.message });
    }
  }
);

router.post("/confirm", auth, loadUser, async (req, res) => {
  try {
    // 🔒 check limit FIRST
    if (!canUploadToday(req.user)) {
      return res.status(403).json({
        upgrade: true,
        message: "Free plan allows 1 upload per day"
      });
    }

    // ✅ define cleaned BEFORE using it
    const cleaned = (req.body.transactions || []).filter(
      t =>
        t &&
        t.date &&
        t.description &&
        typeof t.amount === "number" &&
        !Number.isNaN(t.amount) &&
        t.cardId &&
        t.currency
    );

    if (!cleaned.length) {
      return res.status(400).json({ error: "No valid transactions" });
    }

    // 🛡️ dedupe + attach userId
    const unique = new Map();

    cleaned.forEach(t => {
      const key = `${t.date}-${t.description}-${t.amount}-${t.cardId}`;
      unique.set(key, {
        ...t,
        userId: req.user._id
      });
    });

    const deduped = Array.from(unique.values());

    await Transaction.insertMany(deduped, { ordered: false });

    // ✅ safe increment
    req.user.uploadsToday = (req.user.uploadsToday || 0) + 1;
    req.user.lastUploadDate = new Date();
    await req.user.save();

    res.json({ success: true, inserted: deduped.length });
  } catch (err) {
    console.error("Confirm failed:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
