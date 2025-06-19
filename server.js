const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const projectRoutes = require("./routes/ProjetRoutes");
app.use("/api/projects", projectRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("MongoDB connected");
  app.listen(process.env.PORT || 5050, () => {
    console.log("Server running on port", process.env.PORT || 5000);
  });
}).catch((err) => {
  console.error("MongoDB connection error:", err);
});
