const mongoose = require("mongoose");

const AICategoryCacheSchema = new mongoose.Schema({
  merchantKey: {
    type: String,
    unique: true,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    default: 0.7
  }
});

module.exports = mongoose.model("AICategoryCache", AICategoryCacheSchema);
