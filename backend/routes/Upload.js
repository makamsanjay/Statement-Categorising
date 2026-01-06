const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const XLSX = require("xlsx");
const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");

const Transaction = require("../models/Transaction");
const categorize = require("../utils/categorize");
const { aiCategorize } = require("../ai/aiCategorize");
const AICategoryCache = require("../models/AICategoryCache");
const normalizeMerchant = require("../utils/normalizeMerchant");

const router = express.Router();

const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    const allowed = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/pdf",
    ];

    if (!allowed.includes(file.mimetype)) {
      return cb(
        new Error(
          "Sorry, we only accept CSV, Excel, or PDF files. Please mail us your file type!"
        )
      );
    }
    cb(null, true);
  },
});

function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
}

async function parsePDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdfParse(dataBuffer);

  if (pdfData.text && pdfData.text.trim().length > 50) {
    return parseTextToRows(pdfData.text);
  }

  try {
    const ocr = await Tesseract.recognize(filePath, "eng");
    return parseTextToRows(ocr.data.text);
  } catch (err) {
    console.error("OCR failed:", err.message);
    return []; 
  }
}


function parseTextToRows(text) {
  const lines = text.split("\n");
  const rows = [];

  for (const line of lines) {
    const match = line.match(
      /(\d{4}-\d{2}-\d{2}).*?([A-Za-z ].*?)\s+(-?\d+(\.\d+)?)/ 
    );

    if (match) {
      rows.push({
        date: match[1],
        description: match[2].trim(),
        amount: Number(match[3]),
      });
    }
  }
  return rows;
}

router.post("/", upload.single("file"), async (req, res) => {
  try {
    let rows = [];

    if (req.file.mimetype === "text/csv") {
      rows = await new Promise((resolve, reject) => {
        const temp = [];
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on("data", (row) => temp.push(row))
          .on("end", () => resolve(temp))
          .on("error", reject);
      });
    } 
    else if (
      req.file.mimetype.includes("excel") ||
      req.file.mimetype.includes("spreadsheet")
    ) {
      rows = parseExcel(req.file.path);
    } 
    else if (req.file.mimetype === "application/pdf") {
      rows = await parsePDF(req.file.path);
    }

    const formatted = [];

    for (const row of rows) {
      const date = row.date || row.Date;
      const description = row.description || row.Description;
      const amount = Number(row.amount || row.Amount);

      if (!date || !description || isNaN(amount)) continue;

      let result = categorize(description);

      if (result.category === "UNKNOWN") {
        const merchantKey = normalizeMerchant(description);

        const cached = await AICategoryCache.findOne({ merchantKey });

        if (cached) {
          result = {
            category: cached.category,
            confidence: cached.confidence,
            source: "ai-cache",
          };
        } else {
          const aiCategory = await aiCategorize(description);

          result = {
            category: aiCategory,
            confidence: 0.7,
            source: "ai",
          };

          await AICategoryCache.create({
            merchantKey,
            category: aiCategory,
            confidence: 0.7,
          });
        }
      }

      formatted.push({
        date,
        description,
        amount,
        category: result.category,
        confidence: result.confidence,
        categorySource: result.source || "rule",
      });
    }

    await Transaction.insertMany(formatted);
    fs.unlinkSync(req.file.path);

    res.json({
      message: "File uploaded successfully",
      inserted: formatted.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/preview", upload.single("file"), async (req, res) => {
  try {
    let rows = [];

    if (req.file.mimetype === "text/csv") {
      rows = await parseCSV(req.file.path);
    } else if (req.file.mimetype.includes("excel")) {
      rows = parseExcel(req.file.path);
    } else if (req.file.mimetype === "application/pdf") {
      rows = await parsePDF(req.file.path);
    }

    const preview = [];

    for (const row of rows) {
      const date = row.date || row.Date;
      const description = row.description || row.Description;
      const amount = Number(row.amount || row.Amount);

      if (!date || !description || isNaN(amount)) continue;

      const result = categorize(description);

      preview.push({
        id: crypto.randomUUID(),
        date,
        description,
        amount,
        category: result.category,
        selected: true 
      });
    }

    fs.unlinkSync(req.file.path);
    res.json(preview);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({
      error: err.message || "File upload failed"
    });
  }
  next(err);
});

router.post("/confirm", async (req, res) => {
  try {
    await Transaction.insertMany(req.body.transactions);
    res.json({ message: "Transactions saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
