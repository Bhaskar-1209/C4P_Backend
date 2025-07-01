const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const authenticateUser = require("../middleware/auth");

// Upload project with base64 images
router.post("/upload", authenticateUser, async (req, res) => {
  try {
    const { title, description, googleFormLink, contributors, images } = req.body;

    if (!images || images.length !== 2) {
      return res.status(400).json({ message: "Exactly 2 images must be uploaded" });
    }

    const project = new Project({
      title,
      description,
      googleFormLink,
      contributors: typeof contributors === "string" ? JSON.parse(contributors) : contributors,
      images,
      uploader: req.user.id,
    });

    await project.save(); // 👈 Important line
    res.status(201).json({ message: "Upload successful", project });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ message: "Failed to upload", error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 }); // newest first
    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ message: "Error fetching projects", error: err.message });
  }
});


// Get project by ID
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate("uploader", "name email");
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.status(200).json(project);
  } catch (err) {
    res.status(500).json({ message: "Error fetching project", error: err.message });
  }
});

// Delete project by ID
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (String(project.uploader) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "You are not authorized to delete this project" });
    }

    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Failed to delete project", error: err.message });
  }
});

module.exports = router;
