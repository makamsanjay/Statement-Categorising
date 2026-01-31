const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    /* =========================
       AUTH CORE
    ========================= */
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },

    password: {
      type: String,
      required: true
    },

    name: {
      type: String,
      trim: true
    },

    phone: {
      type: String,
      trim: true
    },

    /* =========================
       FORGOT PASSWORD
    ========================= */
    forgotPasswordOTP: {
      type: String,
      default: null
    },

    forgotPasswordExpires: {
      type: Date,
      default: null
    },

    forgotPasswordOTPVerified: {
      type: Boolean,
      default: false
    },

    /* =========================
       PLAN & BILLING
    ========================= */
    plan: {
      type: String,
      enum: ["free", "monthly", "yearly"],
      default: "free"
    },

    stripeCustomerId: {
      type: String,
      default: null
    },

    stripeSubscriptionId: {
      type: String,
      default: null
    },

    subscriptionStatus: {
      type: String,
      enum: ["none", "trialing", "active", "canceled"],
      default: "none"
    },

    planExpiresAt: {
      type: Date,
      default: null
    },

    /* =========================
       USAGE LIMITING
    ========================= */
    uploadsToday: {
      type: Number,
      default: 0
    },

    lastUploadDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

/* =========================
   SAFETY INDEX (EXTRA)
========================= */
UserSchema.index({ email: 1 });

module.exports = mongoose.model("User", UserSchema);
