const mongoose = require("mongoose");

const StatementSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  detectedCurrency: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Statement", StatementSchema);
