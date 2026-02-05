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

    // 🔴 Legacy (Stripe) — keep temporarily for safety
    stripeCustomerId: {
      type: String,
      default: null
    },

    stripeSubscriptionId: {
      type: String,
      default: null
    },

    // 🟢 Razorpay (ACTIVE)
    razorpaySubscriptionId: {
      type: String,
      default: null
    },

   subscriptionStatus: {
  type: String,
  enum: [
    "none",          
    "pending",       
    "authenticated", 
    "active",        
    "canceled"       
  ],
  default: "none"
},subscriptionStartedAt: {
  type: Date,
  default: null
},

    planExpiresAt: {
      type: Date,
      default: null
    },
    country: {
  type: String,
  uppercase: true,
  default: "IN" // safe fallback
},
pricingGroup: {
  type: String,
  enum: ["INR", "USD", "EUR", "GBP"],
  default: null,
  index: true
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
   SAFETY INDEX
========================= */
UserSchema.index({ email: 1 });

module.exports = mongoose.model("User", UserSchema);
