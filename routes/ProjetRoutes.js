const express = require("express");
const router = express.Router();
const multer = require("multer");
const streamifier = require("streamifier");
const Project = require("../models/Project");
const authenticateUser = require("../middleware/auth");
const cloudinary = require("../utils/cloudinary");

// Use memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper: Upload buffer to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "project" },
      (error, result) => {
        if (result) resolve(result.secure_url);
        else reject(error);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// POST /api/projects/upload
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

    // Upload all files to Cloudinary
    const imageUploadPromises = req.files.map(file => uploadToCloudinary(file.buffer));
    const uploadedImageUrls = await Promise.all(imageUploadPromises);

    const newProject = new Project({
      title,
      description,
      googleFormLink,
      images: uploadedImageUrls,
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

// GET all projects
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

// GET single project by ID
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

// DELETE project
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only uploader or admin can delete
    if (String(project.uploader) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "You are not authorized to delete this project" });
    }

    // Optional: You could delete Cloudinary images using public_id if stored
    // For now, we're only deleting the MongoDB record

    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ message: "Failed to delete project", error: err.message });
  }
});

module.exports = router;
