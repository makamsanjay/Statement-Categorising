const mongoose = require("mongoose");

const CardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    last4: {
      type: String,
      maxlength: 4
    },

    // 🧠 AI-detected original card names
    originalNames: {
      type: [String],
      default: []
    },

    detectedIssuer: {
      type: String,
      default: null
    },

    detectedNetwork: {
      type: String,
      default: null
    },

    baseCurrency: {
      type: String,
      enum: ["USD", "INR", "EUR", "GBP"],
      default: "USD"
    },

    displayCurrency: {
      type: String,
      enum: ["USD", "INR", "EUR", "GBP"],
      default: "USD"
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Card", CardSchema);
