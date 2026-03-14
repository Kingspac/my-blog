const Media = require("../models/Media");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const uploadMiddleware = multer({
  dest: "uploads",
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
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

// GET ALL MEDIA
exports.getAllMedia = async (req, res) => {
  try {
    const media = await Media.find()
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

    jwt.verify(token, secret, {}, async (error, info) => {
      if (error) return res.status(403).json("invalid token");

      try {
        const { title, artist, description, youtubeLink, category } = req.body;

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
          artist: artist || "",
          description,
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
