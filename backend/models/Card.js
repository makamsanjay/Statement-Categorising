const mongoose = require("mongoose");

const CardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  last4: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Card", CardSchema);
