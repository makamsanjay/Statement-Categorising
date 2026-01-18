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

let allTransactions = [];
let skippedFiles = [];


const upload = multer({
  dest: "uploads/",
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
      cb(new Error("Sorry, we only accept CSV, Excel, or PDF files."));
    }
  }
});

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
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

  return await aiExtractTransactions(text);
}


function parseTextToRows(text) {
  const rows = [];
  for (const line of text.split("\n")) {
    const match = line.match(
      /(\d{4}-\d{2}-\d{2}).*?(.+?)\s+(-?\d+(\.\d+)?)/
    );
    if (match) {
      rows.push({
        date: match[1],
        description: match[2].trim(),
        amount: Number(match[3])
      });
    }
  }
  return rows;
}

async function resolveCategory(description) {
  let result = categorize(description);

  if (
    result.category === "UNKNOWN" ||
    result.category === "Other" ||
    result.confidence < 0.5
  ) {
    const merchantKey = normalizeMerchant(description);
    const cached = await AICategoryCache.findOne({ merchantKey });

    if (cached) {
      return { ...cached.toObject(), source: "ai-cache" };
    }

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

function normalizeRow(row) {
  const clean = {};
  for (const key in row) {
    clean[key.trim().toLowerCase()] = row[key];
  }
  return clean;
}

async function parseFile(req) {
  const name = req.file.originalname.toLowerCase();
  if (name.endsWith(".csv")) return await parseCSV(req.file.path);
  if (name.endsWith(".xls") || name.endsWith(".xlsx")) return parseExcel(req.file.path);
  if (name.endsWith(".pdf")) return await parsePDF(req.file.path);
  throw new Error("Unsupported file type");
}

router.post("/", upload.array("file", 10), async (req, res) => {
  try {
    let allTransactions = [];
    let skippedFiles = [];

    for (const file of req.files) {
      let rows = [];
      const name = file.originalname.toLowerCase();

      try {
        if (name.endsWith(".csv")) {
          rows = await parseCSV(file.path);
        } else if (name.endsWith(".xls") || name.endsWith(".xlsx")) {
          rows = parseExcel(file.path);
        } else if (name.endsWith(".pdf")) {
          rows = await parsePDF(file.path);
        }

        if (!rows || rows.length === 0) {
          skippedFiles.push({
            file: file.originalname,
            reason: "No transactions found"
          });
          continue;
        }

        for (const row of rows) {
          const date = row.date || row.Date;
          const description = row.description || row.Description;
          const amount = Number(row.amount || row.Amount);

          if (!date || !description || isNaN(amount)) continue;

          const result = await resolveCategory(description);

          allTransactions.push({
            date,
            description,
            amount,
            category: result.category,
            confidence: result.confidence,
            categorySource: result.source
          });
        }

      } catch (err) {
        skippedFiles.push({
          file: file.originalname,
          reason: "Failed to parse"
        });
      } finally {
        fs.existsSync(file.path) && fs.unlinkSync(file.path);
      }
    }

    if (allTransactions.length === 0) {
      return res.status(400).json({
        error: "No transactions found in uploaded file(s)",
        skippedFiles
      });
    }

    await Transaction.insertMany(allTransactions);

    res.json({
      message: "Upload completed",
      inserted: allTransactions.length,
      skippedFiles
    });

  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({
      error: "Upload failed",
      details: err.message
    });
  }
});


router.post("/preview", upload.array("file", 10), async (req, res) => {
  try {
    let preview = [];

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


router.post("/confirm", async (req, res) => {
  try {
    await Transaction.insertMany(req.body.transactions);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
