const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    default: "Uncategorized"
  },
  taxEligible: {
    type: Boolean,
    default: false
  },
  confidence: {
  type: Number,
  default: 0.8
},
userOverridden: {
  type: Boolean,
  default: false
}

}, { timestamps: true });

module.exports = mongoose.model("Transaction", TransactionSchema);
