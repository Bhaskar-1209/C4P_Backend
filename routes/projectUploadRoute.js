const express = require("express");
const router = express.Router();
const multer = require("multer");
const streamifier = require("streamifier");
const Project = require("../models/Project");
const cloudinary = require("../cloudinary");

// Use memory storage (no local disk save)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// @route   POST /api/projects/upload
// @desc    Upload project with 2 images
// @access  Public (no auth)
router.post("/", upload.array("images", 2), async (req, res) => {
  try {
    const { title, description, googleFormLink, contributors, uploadedBy, uploadedByName, uploadedByEmail } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const uploadedImages = await Promise.all(
      req.files.map(file => uploadToCloudinary(file.buffer, "projects"))
    );

    const imageUrls = uploadedImages.map(img => img.secure_url);

    const contributorArray = JSON.parse(contributors || "[]");

    const newProject = new Project({
      title,
      description,
      googleFormLink,
      contributors: contributorArray,
      images: imageUrls,
      uploadedBy,
      uploadedByName,
      uploadedByEmail,
    });

    await newProject.save();

    res.status(201).json({
      message: "✅ Project uploaded successfully",
      project: newProject,
    });
  } catch (err) {
    console.error("❌ Error uploading project:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

module.exports = router;
