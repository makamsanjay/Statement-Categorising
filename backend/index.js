require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const transactionRoutes = require("./routes/Transactions");
const uploadRoutes = require("./routes/Upload");
const BudgetRoutes = require("./routes/budget");
const HealthScore = require("./routes/health")

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

// Routes
app.use("/transactions", transactionRoutes);
app.use("/upload", uploadRoutes);

app.use("/budget", BudgetRoutes);

app.use("/health", HealthScore );

const cardRoutes = require("./routes/cards");

app.use("/cards", cardRoutes);

app.use("/statements", require("./routes/statements"));
app.use("/analytics", require("./routes/analytics"));
app.use("/cards", require("./routes/cards"));

 

// MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Mongo error:", err.message));

// Health check

app.get("/", (req, res) => {
  res.status(200).send("Backend running");
});


const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});