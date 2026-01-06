const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const Transaction = require("../models/Transaction");

const router = express.Router();

// temp upload folder
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("file"), (req, res) => {
  const results = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      try {
        const formatted = results.map((row) => ({
          date: row.date || row.Date,
          description: row.description || row.Description,
          amount: Number(row.amount || row.Amount),
        }));

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
