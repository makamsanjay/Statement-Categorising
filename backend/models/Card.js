const mongoose = require("mongoose");

const CardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  last4: String,

  baseCurrency: {
    type: String,
    enum: ["USD", "INR", "EUR", "GBP"],
    required: true
  },

  displayCurrency: {
    type: String,
    enum: ["USD", "INR", "EUR", "GBP"],
    required: true
  },

  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model("Card", CardSchema);
