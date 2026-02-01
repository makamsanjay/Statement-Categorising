const mongoose = require("mongoose");

/* ---------------- SUGGESTED CARD ---------------- */

const SuggestedCardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    issuer: {
      type: String
    },

    /* 🔑 free | paid */
    cardType: {
      type: String,
      enum: ["free", "paid"],
      required: true
    },

    /* 💰 only meaningful if paid */
    annualFee: {
      type: Number,
      default: 0
    },

    /* 📊 cashback */
    cashbackRate: {
      type: String, // "5%"
      required: true
    },

    estimatedSavings: {
      type: String, // "$42.50"
      required: true
    },

    /* 🔁 rotating category metadata (optional) */
    rotation: {
      active: {
        type: Boolean,
        default: false
      },
      validFor: {
        type: String // e.g. "Food & Dining"
      },
      validUntil: {
        type: String // e.g. "2026-03-31"
      },
      note: {
        type: String // "Q1 2026 rotating category"
      }
    },

    /* 🧠 short explanation */
    reason: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

/* ---------------- CARD SUGGESTION ---------------- */

const CardSuggestionSchema = new mongoose.Schema(
  {
    /* -------- ownership -------- */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },

    /* -------- prompt identity (overwrite key) -------- */
    category: {
      type: String,
      required: true
    },

    scope: {
      type: String,
      enum: ["all", "single"],
      required: true
    },

    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    /* -------- context -------- */
    currency: {
      type: String,
      default: "USD"
    },

    country: {
      type: String,
      default: "US"
    },

    totalSpent: {
      type: Number,
      default: 0
    },

    /* -------- AI result -------- */
    summary: {
      type: String,
      required: true
    },

    /* 🔥 exactly 2 best cards in country */
    cards: {
      type: [SuggestedCardSchema],
      validate: v => Array.isArray(v) && v.length === 2
    }
  },
  { timestamps: true }
);

/* 🔁 overwrite same prompt */
CardSuggestionSchema.index(
  {
    userId: 1,
    category: 1,
    scope: 1,
    cardId: 1
  },
  { unique: true }
);

module.exports = mongoose.model("CardSuggestion", CardSuggestionSchema);
