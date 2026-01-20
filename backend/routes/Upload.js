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

  return aiExtractTransactions(text);
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
   UPLOAD (NON-PDF)
========================= */
router.post("/", upload.array("file", 10), async (req, res) => {
  try {
    const allTransactions = [];
    const skippedFiles = [];

    for (const file of req.files) {
      let rows = [];
      const name = file.originalname.toLowerCase();

      try {
        if (name.endsWith(".csv")) rows = await parseCSV(file.path);
        else if (name.endsWith(".xls") || name.endsWith(".xlsx"))
          rows = parseExcel(file.path);
        else if (name.endsWith(".pdf")) rows = await parsePDF(file.path);

        for (const row of rows) {
          const date = row.date || row.Date;
          const description = row.description || row.Description;
          const amount = Number(row.amount || row.Amount);

          if (!date || !description || Number.isNaN(amount)) continue;

          const result = await resolveCategory(description);

          allTransactions.push({
            date,
            description,
            amount,
            category: result.category,
            confidence: result.confidence
          });
        }
      } catch {
        skippedFiles.push({ file: file.originalname, reason: "Failed to parse" });
      } finally {
        fs.existsSync(file.path) && fs.unlinkSync(file.path);
      }
    }

    if (!allTransactions.length) {
      return res.status(400).json({ error: "No transactions found", skippedFiles });
    }

    await Transaction.insertMany(allTransactions);
    res.json({ success: true, inserted: allTransactions.length, skippedFiles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   PDF PREVIEW
========================= */
router.post("/preview", upload.array("file", 10), async (req, res) => {
  try {
    const preview = [];

    for (const file of req.files) {
      if (!file.originalname.toLowerCase().endsWith(".pdf")) continue;

      const rows = await parsePDF(file.path);
      for (const row of rows) {
        const result = await resolveCategory(row.description);

        preview.push({
          id: crypto.randomUUID(),
          ...row,
          category: result.category,
          confidence: result.confidence,
          selected: true
        });
      }

      fs.unlinkSync(file.path);
    }

    res.json(preview);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* =========================
   CONFIRM SAVE (FINAL FIX)
========================= */
router.post("/confirm", async (req, res) => {
  try {
    const cleaned = (req.body.transactions || []).filter(t =>
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

    await Transaction.insertMany(cleaned, { ordered: false });

    res.json({ success: true, inserted: cleaned.length });
  } catch (err) {
    console.error("Confirm failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
