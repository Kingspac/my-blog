const Music = require("../models/Music");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");

const uploadMiddleware = multer({
  dest: "uploads",
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for audio
});

const secret = process.env.JWT_SECRET;

// GET ALL MUSIC
exports.getAllMusic = async (req, res) => {
  try {
    const music = await Music.find()
      .populate("uploadedBy", ["username"])
      .sort({ createdAt: -1 });
    res.json(music);
  } catch (e) {
    res.status(500).json({ message: "Failed to get music", error: e.message });
  }
};

// GET SINGLE MUSIC
exports.getSingleMusic = async (req, res) => {
  const { id } = req.params;
  try {
    const music = await Music.findById(id).populate("uploadedBy", ["username"]);
    res.json(music);
  } catch (e) {
    res.status(500).json({ message: "Failed to get music", error: e.message });
  }
};

// UPLOAD MUSIC
exports.uploadMusic = [
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

        // Handle audio file upload
        if (req.files?.audioFile) {
          const { originalname, path } = req.files.audioFile[0];
          const ext = originalname.split(".").pop();
          const newPath = path + "." + ext;
          fs.renameSync(path, newPath);
          audioFilePath = newPath;
        }

        // Handle cover photo upload
        if (req.files?.coverPhoto) {
          const { originalname, path } = req.files.coverPhoto[0];
          const ext = originalname.split(".").pop();
          const newPath = path + "." + ext;
          fs.renameSync(path, newPath);
          coverPhotoPath = newPath;
        }

        const musicDoc = await Music.create({
          title,
          artist,
          description,
          audioFile: audioFilePath,
          youtubeLink: youtubeLink || null,
          coverPhoto: coverPhotoPath,
          uploadedBy: info.id,
          category: category || "music",
        });

        res.json(musicDoc);
      } catch (e) {
        res.status(500).json({ message: "Upload failed", error: e.message });
      }
    });
  },
];

// DELETE MUSIC
exports.deleteMusic = async (req, res) => {
  const { id } = req.params;
  const { token } = req.cookies;

  jwt.verify(token, secret, {}, async (error, info) => {
    if (error) return res.status(403).json("invalid token");

    const musicDoc = await Music.findById(id);
    if (!musicDoc) return res.status(404).json("not found");

    const isOwner =
      JSON.stringify(musicDoc.uploadedBy) === JSON.stringify(info.id);
    if (!isOwner) return res.status(403).json("not authorized");

    await musicDoc.deleteOne();
    res.json("deleted successfully");
  });
};

// LIKE / UNLIKE MUSIC
exports.likeMusic = async (req, res) => {
  const { id } = req.params;
  const { token } = req.cookies;

  jwt.verify(token, secret, {}, async (error, info) => {
    if (error) return res.status(403).json("invalid token");

    const musicDoc = await Music.findById(id);
    if (!musicDoc) return res.status(404).json("not found");

    const alreadyLiked = musicDoc.likes.includes(info.id);

    if (alreadyLiked) {
      musicDoc.likes = musicDoc.likes.filter(
        (userId) => userId.toString() !== info.id.toString()
      );
    } else {
      musicDoc.likes.push(info.id);
    }

    await musicDoc.save();
    res.json({ likes: musicDoc.likes.length, liked: !alreadyLiked });
  });
};
