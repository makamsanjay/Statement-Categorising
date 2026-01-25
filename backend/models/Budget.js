const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    category: {
      type: String,
      required: true
    },

    amount: {
      type: Number,
      required: true
    },

    month: {
      type: String,
      required: true,
      index: true 
    },

    scope: {
      type: String,
      enum: ["ALL", "CARD"],
      default: "ALL"
    },

    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
      default: null
    }
  },
  { timestamps: true }
);

// Prevent duplicates
budgetSchema.index(
  { userId: 1, category: 1, month: 1, cardId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Budget", budgetSchema);
