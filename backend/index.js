require("dotenv").config();
const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

const Transaction = require("./models/Transaction");

Transaction.create({
  date: "2025-01-01",
  description: "Test Transaction",
  amount: -100,
  category: "Food",
  taxEligible: false
})
.then(() => console.log("Test transaction saved"))
.catch(console.error);
