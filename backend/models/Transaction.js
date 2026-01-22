const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
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
    },
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
      required: true
    },
    currency: {
      type: String,
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, cardId: 1, createdAt: -1 });

module.exports = mongoose.model("Transaction", TransactionSchema);
