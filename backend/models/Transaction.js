const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  date: String,
  description: String,
  amount: Number,
  category: String,
  taxEligible: Boolean
});

module.exports = mongoose.model("Transaction", TransactionSchema);
