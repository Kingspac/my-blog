const Education = require("../models/Education");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");

const uploadMiddleware = multer({
  dest: "uploads",
  limits: { fileSize: 100 * 1024 * 1024 }, // 5MB for cover images
});

const secret = process.env.JWT_SECRET;

// GET ALL EDUCATION CONTENT
exports.getAllEducation = async (req, res) => {
  try {
    const education = await Education.find()
      .populate("author", ["username"])
      .sort({ createdAt: -1 });
    res.json(education);
  } catch (e) {
    res.status(500).json({ message: "Failed to get education content", error: e.message });
  }
};

// GET SINGLE EDUCATION CONTENT
exports.getSingleEducation = async (req, res) => {
  const { id } = req.params;
  try {
    const education = await Education.findById(id)
      .populate("author", ["username"]);
    if (!education) return res.status(404).json("not found");
    res.json(education);
  } catch (e) {
    res.status(500).json({ message: "Failed to get content", error: e.message });
  }
};

// CREATE EDUCATION CONTENT
exports.createEducation = [
  uploadMiddleware.single("cover"),
  async (req, res) => {
    const { token } = req.cookies;

    jwt.verify(token, secret, {}, async (error, info) => {
      if (error) return res.status(403).json("invalid token");

      try {
        const { title, content, summary, youtubeLink, category, language } = req.body;

        let coverPath = null;

        // Handle cover image upload
        if (req.file) {
          const { originalname, path } = req.file;
          const ext = originalname.split(".").pop();
          const newPath = path + "." + ext;
          fs.renameSync(path, newPath);
          coverPath = newPath;
        }

        const educationDoc = await Education.create({
          title,
          content,
          summary,
          cover: coverPath,
          youtubeLink: youtubeLink || null,
          category,
          language: language || null,
          author: info.id,
        });

        res.json(educationDoc);
      } catch (e) {
        res.status(500).json({ message: "Failed to create content", error: e.message });
      }
    });
  },
];

// EDIT EDUCATION CONTENT
exports.editEducation = [
  uploadMiddleware.single("cover"),
  async (req, res) => {
    const { token } = req.cookies;

    jwt.verify(token, secret, {}, async (error, info) => {
      if (error) return res.status(403).json("invalid token");

      try {
        const { id } = req.params;
        const { title, content, summary, youtubeLink, category, language } = req.body;

        const educationDoc = await Education.findById(id);
        if (!educationDoc) return res.status(404).json("not found");

        const isAuthor = educationDoc.author.toString() === info.id.toString();
        if (!isAuthor) return res.status(403).json("not authorized");

        const updateData = { title, content, summary, category, language };

        if (req.file) {
          const { originalname, path } = req.file;
          const ext = originalname.split(".").pop();
          const newPath = path + "." + ext;
          fs.renameSync(path, newPath);
          updateData.cover = newPath;
        }

        if (youtubeLink) updateData.youtubeLink = youtubeLink;

        const updated = await Education.findByIdAndUpdate(id, updateData, { new: true });
        res.json(updated);
      } catch (e) {
        res.status(500).json({ message: "Failed to edit content", error: e.message });
      }
    });
  },
];

// DELETE EDUCATION CONTENT
exports.deleteEducation = async (req, res) => {
  const { id } = req.params;
  const { token } = req.cookies;

  jwt.verify(token, secret, {}, async (error, info) => {
    if (error) return res.status(403).json("invalid token");

    const educationDoc = await Education.findById(id);
    if (!educationDoc) return res.status(404).json("not found");

    const isAuthor = educationDoc.author.toString() === info.id.toString();
    if (!isAuthor) return res.status(403).json("not authorized");

    await educationDoc.deleteOne();
    res.json("deleted successfully");
  });
};

// LIKE / UNLIKE EDUCATION CONTENT
exports.likeEducation = async (req, res) => {
  const { id } = req.params;
  const { token } = req.cookies;

  jwt.verify(token, secret, {}, async (error, info) => {
    if (error) return res.status(403).json("invalid token");

    const educationDoc = await Education.findById(id);
    if (!educationDoc) return res.status(404).json("not found");

    const alreadyLiked = educationDoc.likes.includes(info.id);

    if (alreadyLiked) {
      educationDoc.likes = educationDoc.likes.filter(
        (userId) => userId.toString() !== info.id.toString()
      );
    } else {
      educationDoc.likes.push(info.id);
    }

    await educationDoc.save();
    res.json({ likes: educationDoc.likes.length, liked: !alreadyLiked });
  });
};
