const Education = require("../models/Education");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");

const uploadMiddleware = multer({
  dest: "uploads",
  limits: { fileSize: 5 * 1024 * 1024 },
});

const secret = process.env.JWT_SECRET;

// Helper - verify token and return user info
function verifyToken(token) {
  return new Promise((resolve, reject) => {
    if (!token) return reject("no token");
    jwt.verify(token, secret, {}, (err, info) => {
      if (err) return reject("invalid token");
      resolve(info);
    });
  });
}

// ===== GET ALL APPROVED EDUCATION (public) =====
exports.getAllEducation = async (req, res) => {
  try {
    const education = await Education.find({ status: "approved" })
      .populate("author", ["username"])
      .sort({ createdAt: -1 });
    res.json(education);
  } catch (e) {
    res.status(500).json({ message: "Failed to get content", error: e.message });
  }
};

// ===== GET PENDING (admin only) =====
exports.getPendingEducation = async (req, res) => {
  const { token } = req.cookies;
  try {
    const info = await verifyToken(token);
    const user = await User.findById(info.id);
    if (!user?.isAdmin) return res.status(403).json("not authorized");

    const pending = await Education.find({ status: "pending" })
      .populate("author", ["username"])
      .sort({ createdAt: -1 });
    res.json(pending);
  } catch (e) {
    res.status(403).json(e);
  }
};

// ===== GET SINGLE =====
exports.getSingleEducation = async (req, res) => {
  const { id } = req.params;
  try {
    const education = await Education.findById(id).populate("author", ["username"]);
    if (!education) return res.status(404).json("not found");
    res.json(education);
  } catch (e) {
    res.status(500).json({ message: "Failed to get content", error: e.message });
  }
};

// ===== CREATE (logged in, starts as pending) =====
exports.createEducation = [
  uploadMiddleware.single("cover"),
  async (req, res) => {
    const { token } = req.cookies;
    try {
      const info = await verifyToken(token);
      const { title, content, summary, youtubeLink, category, language } = req.body;

      let coverPath = null;
      if (req.file) {
        const { originalname, path } = req.file;
        const ext = originalname.split(".").pop();
        const newPath = path + "." + ext;
        fs.renameSync(path, newPath);
        coverPath = newPath;
      }

      // Check if user is admin — if so, auto-approve
      const user = await User.findById(info.id);
      const status = user?.isAdmin ? "approved" : "pending";

      const educationDoc = await Education.create({
        title,
        content,
        summary,
        cover: coverPath,
        youtubeLink: youtubeLink || null,
        category,
        language: language || null,
        author: info.id,
        status,
      });

      res.json({ ...educationDoc.toObject(), status });
    } catch (e) {
      res.status(500).json({ message: "Failed to create content", error: e.message });
    }
  },
];

// ===== APPROVE (admin only) =====
exports.approveEducation = async (req, res) => {
  const { id } = req.params;
  const { token } = req.cookies;
  try {
    const info = await verifyToken(token);
    const user = await User.findById(info.id);
    if (!user?.isAdmin) return res.status(403).json("not authorized");

    const doc = await Education.findByIdAndUpdate(
      id,
      { status: "approved", reviewedBy: info.id, reviewNote: "" },
      { new: true }
    );
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: "Failed to approve", error: e.message });
  }
};

// ===== REJECT (admin only) =====
exports.rejectEducation = async (req, res) => {
  const { id } = req.params;
  const { reviewNote } = req.body;
  const { token } = req.cookies;
  try {
    const info = await verifyToken(token);
    const user = await User.findById(info.id);
    if (!user?.isAdmin) return res.status(403).json("not authorized");

    const doc = await Education.findByIdAndUpdate(
      id,
      { status: "rejected", reviewedBy: info.id, reviewNote: reviewNote || "" },
      { new: true }
    );
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: "Failed to reject", error: e.message });
  }
};

// ===== EDIT =====
exports.editEducation = [
  uploadMiddleware.single("cover"),
  async (req, res) => {
    const { token } = req.cookies;
    try {
      const info = await verifyToken(token);
      const { id } = req.params;
      const { title, content, summary, youtubeLink, category, language } = req.body;

      const educationDoc = await Education.findById(id);
      if (!educationDoc) return res.status(404).json("not found");

      const isAuthor = educationDoc.author.toString() === info.id.toString();
      const user = await User.findById(info.id);
      if (!isAuthor && !user?.isAdmin) return res.status(403).json("not authorized");

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
      res.status(500).json({ message: "Failed to edit", error: e.message });
    }
  },
];

// ===== DELETE =====
exports.deleteEducation = async (req, res) => {
  const { id } = req.params;
  const { token } = req.cookies;
  try {
    const info = await verifyToken(token);
    const educationDoc = await Education.findById(id);
    if (!educationDoc) return res.status(404).json("not found");

    const isAuthor = educationDoc.author.toString() === info.id.toString();
    const user = await User.findById(info.id);
    if (!isAuthor && !user?.isAdmin) return res.status(403).json("not authorized");

    await educationDoc.deleteOne();
    res.json("deleted successfully");
  } catch (e) {
    res.status(500).json({ message: "Failed to delete", error: e.message });
  }
};

// ===== LIKE =====
exports.likeEducation = async (req, res) => {
  const { id } = req.params;
  const { token } = req.cookies;
  try {
    const info = await verifyToken(token);
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
  } catch (e) {
    res.status(500).json({ message: "Failed to like", error: e.message });
  }
};
