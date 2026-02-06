require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");

const razorpayWebhook = require("./routes/razorpayWebhook");
const { generalLimiter } = require("./middleware/rateLimiters");

const app = express();

/* ================================
   🔐 SECURITY HEADERS
================================ */
app.use(
  helmet({
    contentSecurityPolicy: false, // React needs this disabled
    crossOriginEmbedderPolicy: false
  })
);

/* ================================
   🌍 CORS (LOCKED)
================================ */
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://yourdomain.com" // 🔥 change before prod
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // mobile / curl
      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

/* ================================
   🧱 GLOBAL RATE LIMITER (EARLY)
================================ */
app.use(generalLimiter);

/* ================================
   🔔 RAZORPAY WEBHOOK (RAW BODY)
================================ */
app.post(
  "/api/razorpay/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);

/* ================================
   BODY PARSERS
================================ */
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

/* ================================
   ROUTES
================================ */
app.use("/auth/password", require("./routes/password"));
app.use("/auth", require("./routes/auth"));
app.use("/billing", require("./routes/billing"));
app.use("/transactions", require("./routes/Transactions"));
app.use("/upload", require("./routes/Upload"));
app.use("/budget", require("./routes/budget"));
app.use("/health", require("./routes/health"));
app.use("/cards", require("./routes/cards"));
app.use("/statements", require("./routes/statements"));
app.use("/analytics", require("./routes/analytics"));
app.use("/support", require("./routes/support"));
app.use("/users", require("./routes/user"));
app.use("/ai/card-suggestions", require("./routes/cardSuggestions"));

/* ================================
   ❌ ERROR HANDLER (LAST)
================================ */
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

/* ================================
   DATABASE
================================ */
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => {
    console.error("Mongo error:", err.message);
    process.exit(1);
  });

const PORT = process.env.PORT || 5050;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
