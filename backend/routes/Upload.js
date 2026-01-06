const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const Transaction = require("../models/Transaction");
const categorize = require("../utils/categorize");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("file"), (req, res) => {
  const results = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (row) => results.push(row))
    .on("end", async () => {
      try {
        const formatted = results
          .map((row) => {
            const date = row.date || row.Date;
            const description = row.description || row.Description;
            const amount = Number(row.amount || row.Amount);

            if (!date || !description || isNaN(amount)) return null;

            return {
              date,
              description,
              amount,
              category: categorize(description),
            };
          })
          .filter(Boolean);

        await Transaction.insertMany(formatted);
        fs.unlinkSync(req.file.path);

        res.json({
          message: "CSV uploaded successfully",
          inserted: formatted.length,
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
});

module.exports = router;
