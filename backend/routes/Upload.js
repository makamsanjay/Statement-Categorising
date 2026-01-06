const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const Transaction = require("../models/Transaction");
const categorize = require("../utils/categorize");
const { aiCategorize } = require("../ai/aiCategorize");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("file"), (req, res) => {
  const results = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (row) => results.push(row))
    .on("end", async () => {
      try {
        const formatted = [];

        for (const row of results) {
          const date = row.date || row.Date;
          const description = row.description || row.Description;
          const amount = Number(row.amount || row.Amount);

          if (!date || !description || isNaN(amount)) continue;

          let result = categorize(description);

          if (result.category === "UNKNOWN") {
            const aiCategory = await aiCategorize(description);
            result = {
              category: aiCategory,
              confidence: 0.7,
              source: "ai"
            };
          }

          formatted.push({
            date,
            description,
            amount,
            category: result.category,
            confidence: result.confidence,
            categorySource: result.source || "rule"
          });
        }

        await Transaction.insertMany(formatted);
        fs.unlinkSync(req.file.path);

        res.json({
          message: "CSV uploaded successfully",
          inserted: formatted.length
        });

      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
});

module.exports = router;
