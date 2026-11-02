const Media = require("../models/Media");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const uploadMiddleware = multer({
  dest: "uploads",
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
});

const secret = process.env.JWT_SECRET;

// HELPER - safely delete a file from uploads folder
function deleteFile(filePath) {
  if (!filePath) return;
  const fullPath = path.join(__dirname, "..", filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

// GET MEDIA (With optional category filter)
exports.getAllMedia = async (req, res) => {
  try {
    const { category } = req.query; // Look for ?category=music in the URL
    const filter = category ? { category } : {};

    const media = await Media.find(filter)
      .populate("uploadedBy", ["username"])
      .sort({ createdAt: -1 });

    res.json(media);
  } catch (e) {
    res.status(500).json({ message: "Failed to get media", error: e.message });
  }
};

// GET SINGLE MEDIA
exports.getSingleMedia = async (req, res) => {
  const { id } = req.params;
  try {
    const media = await Media.findById(id).populate("uploadedBy", ["username"]);
    if (!media) return res.status(404).json("not found");
    res.json(media);
  } catch (e) {
    res.status(500).json({ message: "Failed to get media", error: e.message });
  }
};

// UPLOAD MEDIA
exports.uploadMedia = [
  uploadMiddleware.fields([
    { name: "audioFile", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
  ]),
  async (req, res) => {
    const { token } = req.cookies;

    // If we reject the request, remove the temp files multer already saved
    const discardUploads = () => {
      Object.values(req.files || {})
        .flat()
        .forEach((f) => {
          try { fs.unlinkSync(f.path); } catch (_) {}
        });
    };

    jwt.verify(token, secret, {}, async (error, info) => {
      if (error) {
        discardUploads();
        return res.status(403).json("invalid token");
      }

      try {
        const { title, artist, description, youtubeLink, category, releaseDate } = req.body;

        // Artist / creator name is mandatory
        if (!artist || !artist.trim()) {
          discardUploads();
          return res.status(400).json("Artist / creator name is required");
        }

        // Release date (YYYY-MM-DD from the form). Stored at noon UTC so the
        // calendar day doesn't shift when viewed in other timezones.
        let parsedDate = new Date();
        if (releaseDate) {
          const d = new Date(`${releaseDate}T12:00:00.000Z`);
          if (isNaN(d.getTime())) {
            discardUploads();
            return res.status(400).json("Invalid release date");
          }
          parsedDate = d;
        }

        let audioFilePath = null;
        let coverPhotoPath = null;

        if (req.files?.audioFile) {
          const { originalname, path: filePath } = req.files.audioFile[0];
          const ext = originalname.split(".").pop();
          const newPath = filePath + "." + ext;
          fs.renameSync(filePath, newPath);
          audioFilePath = newPath;
        }

        if (req.files?.coverPhoto) {
          const { originalname, path: filePath } = req.files.coverPhoto[0];
          const ext = originalname.split(".").pop();
          const newPath = filePath + "." + ext;
          fs.renameSync(filePath, newPath);
          coverPhotoPath = newPath;
        }

        const mediaDoc = await Media.create({
          title,
          artist: artist.trim(),
          description,
          releaseDate: parsedDate,
          audioFile: audioFilePath,
          youtubeLink: youtubeLink || null,
          coverPhoto: coverPhotoPath,
          uploadedBy: info.id,
          category: category || "music",
        });

        res.json(mediaDoc);
      } catch (e) {
        res.status(500).json({ message: "Upload failed", error: e.message });
      }
    });
  },
];

// DELETE MEDIA
exports.deleteMedia = async (req, res) => {
  const { id } = req.params;
  const { token } = req.cookies;

  jwt.verify(token, secret, {}, async (error, info) => {
    if (error) return res.status(403).json("invalid token");

    try {
      const mediaDoc = await Media.findById(id);
      if (!mediaDoc) return res.status(404).json("not found");

      const isOwner =
        JSON.stringify(mediaDoc.uploadedBy) === JSON.stringify(info.id);
      if (!isOwner) return res.status(403).json("not authorized");

      // Delete files from disk
      deleteFile(mediaDoc.audioFile);
      deleteFile(mediaDoc.coverPhoto);

      await mediaDoc.deleteOne();
      res.json("deleted successfully");
    } catch (e) {
      res.status(500).json({ message: "Delete failed", error: e.message });
    }
  });
};

// LIKE / UNLIKE MEDIA
exports.likeMedia = async (req, res) => {
  const { id } = req.params;
  const { token } = req.cookies;

  jwt.verify(token, secret, {}, async (error, info) => {
    if (error) return res.status(403).json("invalid token");

    try {
      const mediaDoc = await Media.findById(id);
      if (!mediaDoc) return res.status(404).json("not found");

      const alreadyLiked = mediaDoc.likes.includes(info.id);

      if (alreadyLiked) {
        mediaDoc.likes = mediaDoc.likes.filter(
          (userId) => userId.toString() !== info.id.toString()
        );
      } else {
        mediaDoc.likes.push(info.id);
      }

      await mediaDoc.save();
      res.json({ likes: mediaDoc.likes.length, liked: !alreadyLiked });
    } catch (e) {
      res.status(500).json({ message: "Like failed", error: e.message });
    }
  });
};

// ADD COMMENT
exports.addComment = async (req, res) => {
  const { id } = req.params;
  const { token } = req.cookies;

  jwt.verify(token, secret, {}, async (error, info) => {
    if (error) return res.status(403).json("invalid token");

    try {
      const { content } = req.body;
      if (!content?.trim()) return res.status(400).json("comment is empty");

      const mediaDoc = await Media.findById(id);
      if (!mediaDoc) return res.status(404).json("not found");

      const newComment = {
        username: info.username,
        content,
        createdAt: new Date(),
      };

      mediaDoc.comments.push(newComment);
      await mediaDoc.save();

      res.json(newComment);
    } catch (e) {
      res.status(500).json({ message: "Comment failed", error: e.message });
    }
  });
};

// INCREMENT PLAY COUNT
exports.incrementPlayCount = async (req, res) => {
  const { id } = req.params;
  try {
    const media = await Media.findByIdAndUpdate(
      id,
      { $inc: { playCount: 1 } },
      { new: true }
    );
    if (!media) return res.status(404).json("not found");
    res.json({ playCount: media.playCount });
  } catch (e) {
    res.status(500).json({ message: "Failed to update play count", error: e.message });
  }
};