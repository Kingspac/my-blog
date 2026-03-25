const User = require('../models/User');
const Post = require('../models/Post');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require("multer");
const fs = require("fs");

const uploadMiddleware = multer({
  dest: "uploads",
  limits: { fileSize: 20 * 1024 * 1024 }
});

const salt = bcrypt.genSaltSync(10);
const secret = process.env.JWT_SECRET;

// ===== REGISTER =====
exports.register = async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, salt),
    });
    res.json(userDoc);
  } catch (e) {
    res.status(400).json(e);
  }
};

// ===== LOGIN =====
exports.login = async (req, res) => {
  const { username, password } = req.body;
  const userDoc = await User.findOne({ username });
  if (!userDoc) return res.status(400).json("wrong credentials");

  const passOk = bcrypt.compareSync(password, userDoc.password);
  if (passOk) {
    jwt.sign({ username, id: userDoc._id }, secret, {}, (error, token) => {
      if (error) throw error;
      res.cookie("token", token).json({
        id: userDoc._id,
        username,
      });
    });
  } else {
    res.status(400).json("wrong credentials");
  }
};

// ===== GET CURRENT USER PROFILE (from token) =====
exports.profile = (req, res) => {
  const { token } = req.cookies;
  if (!token) return res.status(401).json("no token");

  jwt.verify(token, secret, {}, (error, info) => {
    if (error) return res.status(403).json("invalid token");
    res.json(info);
  });
};

// ===== LOGOUT =====
exports.logout = (req, res) => {
  res.cookie("token", "").json("ok");
};

// ===== CREATE POST =====
exports.createPost = [
  uploadMiddleware.single("cover"),
  async (req, res) => {
    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (error, info) => {
      if (error) return res.status(403).json("invalid token");
      try {
        const { title, summary, content } = req.body;
        let newPath = null;
        if (req.file) {
          const { originalname, path } = req.file;
          const ext = originalname.split(".").pop();
          newPath = path + "." + ext;
          fs.renameSync(path, newPath);
        }
        const postDoc = await Post.create({
          title,
          summary,
          content,
          cover: newPath,
          author: info.id,
        });
        res.json({ postDoc });
      } catch (e) {
        res.status(500).json({ message: "Failed to create post", error: e.message });
      }
    });
  }
];

// ===== EDIT POST =====
exports.editPost = [
  uploadMiddleware.single("cover"),
  async (req, res) => {
    let newPath = null;
    if (req.file) {
      const { originalname, path } = req.file;
      const ext = originalname.split(".").pop();
      newPath = path + "." + ext;
      fs.renameSync(path, newPath);
    }
    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (error, info) => {
      if (error) return res.status(403).json("invalid token");
      const { id, title, summary, content } = req.body;
      const postDoc = await Post.findById(id);
      if (!postDoc) return res.status(404).json("post not found");
      const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
      if (!isAuthor) return res.status(400).json("you are not the author");
      await postDoc.updateOne({
        title,
        summary,
        content,
        cover: newPath ? newPath : postDoc.cover,
      });
      res.json({ postDoc });
    });
  }
];

// ===== GET ALL POSTS =====
exports.getPosts = async (req, res) => {
  const posts = await Post.find()
    .populate("author", ["username"])
    .sort({ createdAt: -1 })
    .limit(20);
  res.json(posts);
};

// ===== GET SINGLE POST =====
exports.getPostId = async (req, res) => {
  const { id } = req.params;
  const postDoc = await Post.findById(id).populate("author", ["username"]);
  res.json(postDoc);
};

// ===== DELETE POST =====
exports.deletePost = async (req, res) => {
  const { id } = req.params;
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (error, info) => {
    if (error) return res.status(403).json("invalid token");
    const postDoc = await Post.findById(id);
    if (!postDoc) return res.status(404).json("post not found");
    const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
    if (!isAuthor) return res.status(403).json("you are not the author");
    await postDoc.deleteOne();
    res.json("post deleted successfully");
  });
};

// ===== LIKE / UNLIKE POST =====
exports.likePost = async (req, res) => {
  const { id } = req.params;
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (error, info) => {
    if (error) return res.status(403).json("invalid token");
    const postDoc = await Post.findById(id);
    if (!postDoc) return res.status(404).json("post not found");
    const alreadyLiked = postDoc.likes.includes(info.id);
    if (alreadyLiked) {
      postDoc.likes = postDoc.likes.filter(
        userId => userId.toString() !== info.id.toString()
      );
    } else {
      postDoc.likes.push(info.id);
    }
    await postDoc.save();
    res.json({ likes: postDoc.likes.length, liked: !alreadyLiked });
  });
};

// ===== ADD COMMENT TO POST =====
exports.addComment = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (error, info) => {
    if (error) return res.status(403).json("invalid token");
    const postDoc = await Post.findById(id);
    if (!postDoc) return res.status(404).json("post not found");
    const newComment = {
      content,
      author: info.id,
      username: info.username,
      createdAt: new Date(),
    };
    postDoc.comments.push(newComment);
    await postDoc.save();
    res.json(newComment);
  });
};

// ===== GET USER PROFILE BY ID =====
exports.getProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json("user not found");
    const posts = await Post.find({ author: id })
      .populate("author", ["username"])
      .sort({ createdAt: -1 });
    res.json({ user, posts });
  } catch (e) {
    res.status(500).json({ message: "Failed to get profile", error: e.message });
  }
};

// ===== UPDATE PROFILE =====
exports.updateProfile = [
  uploadMiddleware.single("profilePhoto"),
  async (req, res) => {
    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (error, info) => {
      if (error) return res.status(403).json("invalid token");
      try {
        const { bio } = req.body;
        const updateData = { bio };
        if (req.file) {
          const { originalname, path } = req.file;
          const ext = originalname.split(".").pop();
          const newPath = path + "." + ext;
          fs.renameSync(path, newPath);
          updateData.profilePhoto = newPath;
        }
        const updatedUser = await User.findByIdAndUpdate(
          info.id,
          updateData,
          { new: true }
        ).select("-password");
        res.json(updatedUser);
      } catch (e) {
        res.status(500).json({ message: "Failed to update profile", error: e.message });
      }
    });
  }
];

// ===== GET ALL USERS (for search) =====
exports.getUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const query = q ? { username: { $regex: q, $options: "i" } } : {};
    const users = await User.find(query)
      .select("_id username bio profilePhoto")
      .limit(20);
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: "Failed to get users", error: e.message });
  }
};

// ===== DELETE ACCOUNT =====
exports.deleteAccount = async (req, res) => {
  const { token } = req.cookies;

  jwt.verify(token, secret, {}, async (error, info) => {
    if (error) return res.status(403).json("invalid token");

    try {
      // Delete all posts by this user
      await Post.deleteMany({ author: info.id });

      // Delete the user
      await User.findByIdAndDelete(info.id);

      // Clear cookie
      res.cookie("token", "").json({ message: "Account deleted successfully" });

    } catch (e) {
      res.status(500).json({ message: "Failed to delete account", error: e.message });
    }
  });
};
 