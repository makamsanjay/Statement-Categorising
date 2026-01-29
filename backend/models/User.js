const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },

    // 🔐 PLAN & BILLING
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

    uploadsToday: {
      type: Number,
      default: 0
    },
  planExpiresAt: {
  type: Date,
  default: null
},
    lastUploadDate: {
      type: Date,
      default: null
    },
    name: String,
email: String,
phone: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
