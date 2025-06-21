const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    images: [String],
    contributors: [String],
    googleFormLink: String,
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true } // <-- Required!
);

module.exports = mongoose.model("Project", projectSchema);
