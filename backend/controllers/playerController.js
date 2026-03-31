const Media = require("../models/Media");

// This specifically gets only MUSIC for the player sidebar
exports.getMusicLibrary = async (req, res) => {
  try {
    const library = await Media.find({ category: "music" }) // Filter for music only
      .populate("uploadedBy", ["username"])
      .sort({ createdAt: -1 });
    res.json(library);
  } catch (e) {
    res.status(500).json({ message: "Failed to load library", error: e.message });
  }
};
