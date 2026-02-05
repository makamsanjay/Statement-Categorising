require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const razorpayWebhook = require("./routes/razorpayWebhook");


const app = express();

app.post(
  "/api/razorpay/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);

/* ================================
   NORMAL MIDDLEWARES (AFTER)
   ================================ */
app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

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
   DATABASE
   ================================ */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("Mongo error:", err.message));

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
