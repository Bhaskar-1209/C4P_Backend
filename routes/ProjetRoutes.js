const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Project = require("../models/Project");
const authenticateUser = require("../middleware/auth");

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

router.post("/upload", authenticateUser, upload.array("images", 2), async (req, res) => {
  try {
    const { title, description, googleFormLink } = req.body;
    let contributors = req.body.contributors || [];

    if (typeof contributors === "string") {
      contributors = contributors.split(",").map(c => c.trim()).filter(Boolean);
    }

    if (!title || !description || !googleFormLink || req.files.length !== 2) {
      return res.status(400).json({ message: "All fields and exactly 2 images are required." });
    }

    const imagePaths = req.files.map(file => file.path);

    const newProject = new Project({
      title,
      description,
      googleFormLink,
      images: imagePaths,
      contributors,
      uploader: req.user._id,
    });

    await newProject.save();
    res.status(201).json({ message: "Project uploaded successfully", project: newProject });
  } catch (error) {
    console.error("Error saving project:", error);
    res.status(500).json({ message: "Failed to upload project", error });
  }
});

router.get("/", async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("uploader", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch projects", error: err.message });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("uploader", "name email");

    if (!project) return res.status(404).json({ message: "Project not found" });
    res.status(200).json(project);
  } catch (err) {
    res.status(500).json({ message: "Error fetching project", error: err.message });
  }
});

// DELETE project by ID
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Optional: Only allow the uploader or admin to delete
    if (String(project.uploader) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "You are not authorized to delete this project" });
    }

    // Delete image files from filesystem
    project.images.forEach((imagePath) => {
      fs.unlink(imagePath, (err) => {
        if (err) console.error(`Failed to delete file: ${imagePath}`, err);
      });
    });

    // Delete project from database
    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ message: "Failed to delete project", error: err.message });
  }
});



module.exports = router;
