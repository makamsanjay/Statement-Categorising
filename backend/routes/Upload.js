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
const Card = require("../models/Card");

const categorize = require("../utils/categorize");
const { aiCategorize } = require("../ai/aiCategorize");
const AICategoryCache = require("../models/AICategoryCache");
const normalizeMerchant = require("../utils/normalizeMerchant");
const { scanFile } = require("../utils/virusScan");
const { shouldEscalateModel } = require("../utils/shouldEscalateModel");

const auth = require("../middleware/auth");
const loadUser = require("../middleware/loadUser");

const router = express.Router();

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
========================= */
function canUploadToday(user) {
  if (typeof user.uploadsToday !== "number") user.uploadsToday = 0;
  if (!user.lastUploadDate) user.lastUploadDate = new Date(0);

  const plan = user.plan || "free";
  const today = new Date().toDateString();

  if (user.lastUploadDate.toDateString() !== today) {
    user.uploadsToday = 0;
    user.lastUploadDate = new Date();
  }

  if (plan !== "free") return true;
  return user.uploadsToday < 1;
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

/* =========================
   PDF PARSER (UNCHANGED)
========================= */
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

  console.log("🤖 Using model: gpt-4o-mini (initial pass)");
  const miniRows = await aiExtractTransactions(text, "gpt-4o-mini");

  if (!Array.isArray(miniRows) || miniRows.length === 0) {
    const strongOnly = await aiExtractTransactions(text, "gpt-4o");
    return Array.isArray(strongOnly) ? strongOnly : [];
  }

  const escalate = shouldEscalateModel(text, miniRows);

  if (!escalate) return miniRows;

  console.log("🤖 Using model: gpt-4o (fallback pass)");
  const strongRows = await aiExtractTransactions(text, "gpt-4o");

  if (!Array.isArray(strongRows) || strongRows.length === 0) {
    return miniRows;
  }

  const missingCount = miniRows.length - strongRows.length;
  if (missingCount > 2) return miniRows;

  return strongRows;
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
   PDF PREVIEW (NO CARD LOGIC)
========================= */
router.post(
  "/preview",
  auth,
  loadUser,
  upload.array("file", 10),
  async (req, res) => {
    try {
      const preview = [];

      for (const file of req.files) {
        try {
          await scanFile(file.path);

          if (!file.originalname.toLowerCase().endsWith(".pdf")) {
            fs.unlinkSync(file.path);
            continue;
          }

          const rows = await parsePDF(file.path);

          for (const row of rows) {
            const result = await resolveCategory(row.description);
            let amount = Number(row.amount);

            if (/purchase|withdrawal|fee|pos|atm/i.test(row.description)) {
              amount = -Math.abs(amount);
            }

            if (/salary|deposit|credit|refund/i.test(row.description)) {
              amount = Math.abs(amount);
            }

            preview.push({
              id: crypto.randomUUID(),
              ...row,
              amount: Number(amount.toFixed(2)),
              category: result.category,
              confidence: result.confidence,
              selected: true
            });
          }

          fs.unlinkSync(file.path);
        } catch (fileErr) {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          return res.status(400).json({
            error: fileErr.message || "File blocked for security reasons"
          });
        }
      }

      res.json({ transactions: preview });
    } catch (err) {
      console.error("Preview failed:", err);
      res.status(400).json({ error: err.message });
    }
  }
);

/* =========================
   CONFIRM & SAVE (NO CARD LOGIC)
========================= */
router.post("/confirm", auth, loadUser, async (req, res) => {
  try {
    if (!canUploadToday(req.user)) {
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

    const unique = new Map();
    cleaned.forEach(t => {
      const key = `${t.date}-${t.description}-${t.amount}-${t.cardId}`;
      unique.set(key, { ...t, userId: req.user._id });
    });

    await Transaction.insertMany([...unique.values()], { ordered: false });

    req.user.uploadsToday += 1;
    req.user.lastUploadDate = new Date();
    await req.user.save();

    res.json({ success: true, inserted: unique.size });
  } catch (err) {
    console.error("Confirm failed:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
