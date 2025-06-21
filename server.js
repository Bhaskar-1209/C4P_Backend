const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load env vars
dotenv.config();

const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/ProjetRoutes"); // ✅ double-check filename

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check route
app.get("/", (req, res) => {
  res.send("🚀 API running successfully.");
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);

// MongoDB and server start
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected");

    const PORT = process.env.PORT || 5050;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });
