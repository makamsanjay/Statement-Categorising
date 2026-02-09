require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");

const razorpayWebhook = require("./routes/razorpayWebhook");
const { generalLimiter } = require("./middleware/rateLimiters");

const app = express();

/* ================================
   🟢 BASIC HEALTH CHECK (REQUIRED)
================================ */
app.get("/", (req, res) => {
  res.status(200).send("SpendSwitch backend running");
});

console.log("🔄 Booting SpendSwitch backend...");

/* ================================
   🔑 TRUST PROXY (REQUIRED)
================================ */
app.set("trust proxy", 1);

/* ================================
   🔐 SECURITY HEADERS
================================ */
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

/* ================================
   🌍 CORS (LOCKED)
================================ */
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://spendswitch.com",
  "https://www.spendswitch.com",
  "https://api.spendswitch.com",
  "https://spendswitch.web.app"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

/* ================================
   🧱 GLOBAL RATE LIMITER
================================ */
app.use(generalLimiter);

/* ================================
   🔔 RAZORPAY WEBHOOK (RAW BODY)
   ⚠️ MUST COME BEFORE JSON PARSER
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
  res.status(err.status || 500).json({
    error: err.message || "Internal server error"
  });
});

/* ================================
   🚀 START SERVER FIRST (CRITICAL)
================================ */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});

/* ================================
   🗄️ DATABASE (NON-BLOCKING)
================================ */
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => {
    console.error("❌ Mongo error:", err.message);
  });