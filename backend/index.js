require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const userRoutes = require("./routes/user");
const app = express();

/* ================================
   ✅ STRIPE WEBHOOK (MUST BE FIRST)
   ================================ */
app.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  require("./routes/stripeWebhook")
);

/* ================================
   ✅ NORMAL MIDDLEWARES (AFTER)
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
app.use("/users", userRoutes);


/* ================================
   DATABASE
   ================================ */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("Mongo error:", err.message));

app.get("/", (_, res) => res.send("Backend running"));

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
