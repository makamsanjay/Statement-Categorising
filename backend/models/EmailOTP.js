const mongoose = require("mongoose");

const EmailOTPSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false }
});

module.exports = mongoose.model("EmailOTP", EmailOTPSchema);
