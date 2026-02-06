require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const razorpayWebhook = require("./routes/razorpayWebhook");
const { generalLimiter } = require("./middleware/rateLimiters");

const app = express();

/* ================================
   🔐 SECURITY HEADERS
================================ */
app.use(
  helmet({
    contentSecurityPolicy: false, // React
    crossOriginEmbedderPolicy: false
  })
);

/* ================================
   🍪 COOKIES
================================ */
app.use(cookieParser());

/* ================================
   🌍 CORS (STRICT + SAFE)
================================ */
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://yourdomain.com"
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true); // curl / mobile apps
      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(
        new Error("CORS_NOT_ALLOWED"),
        false
      );
    },
    credentials: true
  })
);

/* ================================
   🔔 RAZORPAY WEBHOOK (RAW BODY)
   ⚠️ MUST be before body parsers
================================ */
app.post(
  "/api/razorpay/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);

/* ================================
   🧱 GLOBAL RATE LIMITER
   ❗ Excludes webhook
================================ */
app.use((req, res, next) => {
  // 🚫 never rate limit auth bootstrap routes
  if (
    req.path === "/auth/me" ||
    req.path === "/auth/login" ||
    req.path === "/auth/signup" ||
    req.path === "/health" ||     
    req.path.startsWith("/api/razorpay/webhook")
  ) {
    return next();
  }

  return generalLimiter(req, res, next);
});

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
   ❌ GLOBAL ERROR HANDLER
================================ */
app.use((err, req, res, next) => {
  if (err.message === "CORS_NOT_ALLOWED") {
    return res.status(403).json({ error: "CORS blocked" });
  }

  console.error("GLOBAL ERROR:", err);
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
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  });

const PORT = process.env.PORT || 5050;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
