
const User = require('../models/User');
const Post = require('../models/Post');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require("multer");
const uploadMiddleware = multer({ dest: "uploads" });
const fs = require("fs");

const salt = bcrypt.genSaltSync(10);
const secret = process.env.JWT_SECRET;

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

exports.profile = (req, res) => {
  const { token } = req.cookies;
  if (!token) return res.status(401).json("no token");

  jwt.verify(token, secret, {}, (error, info) => {
    if (error) return res.status(403).json("invalid token");
    res.json(info);
  });
};

exports.logout = (req, res) => {
  res.cookie("token", "").json("ok");
};

exports.createPost = [
  uploadMiddleware.single("files"),
  async (req, res) => {
    const { originalname, path } = req.file;
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    const newPath = path + "." + ext;
    fs.renameSync(path, newPath);

    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (error, info) => {
      if (error) return res.status(403).json("invalid token");
      const { title, summary, content } = req.body;
      const postDoc = await Post.create({
        title,
        summary,
        content,
        cover: newPath,
        author: info.id,
      });
      res.json({ postDoc });
    });
  }
];

// ✅ Fixed: array syntax, req.file typo, JSON.stringify, isAuthor check, updateOne
exports.editPost = [
  uploadMiddleware.single("file"),
  async (req, res) => {
    let newPath = null;
    if (req.file) {                                         // ✅ was req.fil
      const { originalname, path } = req.file;
      const parts = originalname.split(".");
      const ext = parts[parts.length - 1];
      newPath = path + "." + ext;
      fs.renameSync(path, newPath);
    }

    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (error, info) => {
      if (error) return res.status(403).json("invalid token");

      const { id, title, summary, content } = req.body;
      const postDoc = await Post.findById(id);

      if (!postDoc) return res.status(404).json("post not found");

      // ✅ was JSON.Stringify(...) === JSON.Stringify() — wrong case, missing arg
      const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
      if (!isAuthor) {                                      // ✅ was !author
        return res.status(400).json("you are not the author");
      }

      await postDoc.updateOne({                            // ✅ was postDoc.update()
        title,
        summary,
        content,
        cover: newPath ? newPath : postDoc.cover,
      });

      res.json({ postDoc });
    });
  }
];

exports.getPosts = async (req, res) => {
  const posts = await Post.find()
    .populate("author", ["username"])
    .sort({ createdAt: -1 })
    .limit(20);
  res.json(posts);
};

exports.getPostId = async (req, res) => {
  const { id } = req.params;
  const postDoc = await Post.findById(id)
    .populate("author", ["username"]);
  res.json(postDoc);
};

// DELETE POST — only the author can delete their post
exports.deletePost = async (req, res) => {
  const { id } = req.params; // get post ID from the URL

  const { token } = req.cookies; // get the logged in user's token

  // verify the token to know who is making the request
  jwt.verify(token, secret, {}, async (error, info) => {
    if (error) return res.status(403).json("invalid token");

    // find the post in MongoDB
    const postDoc = await Post.findById(id);
    if (!postDoc) return res.status(404).json("post not found");

    // check if the logged in user is the author
    const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
    if (!isAuthor) {
      return res.status(403).json("you are not the author");
    }

    // if all checks pass — delete the post
    await postDoc.deleteOne();
    res.json("post deleted successfully");
  });
};

// LIKE / UNLIKE a post — toggles like on and off
exports.likePost = async (req, res) => {
  const { id } = req.params; // post ID from URL
  const { token } = req.cookies;

  jwt.verify(token, secret, {}, async (error, info) => {
    if (error) return res.status(403).json("invalid token");

    const postDoc = await Post.findById(id);
    if (!postDoc) return res.status(404).json("post not found");

    // Check if the user already liked this post
    const alreadyLiked = postDoc.likes.includes(info.id);

    if (alreadyLiked) {
      // User already liked — so remove their ID (unlike)
      postDoc.likes = postDoc.likes.filter(
        userId => userId.toString() !== info.id.toString()
      );
    } else {
      // User hasn't liked — so add their ID (like)
      postDoc.likes.push(info.id);
    }

    await postDoc.save();

    res.json({
      likes: postDoc.likes.length,       // total like count
      liked: !alreadyLiked,              // did the user just like or unlike?
    });
  });
};

// ADD COMMENT to a post
exports.addComment = async (req, res) => {
  const { id } = req.params; // post ID from URL
  const { content } = req.body; // comment text from request body
  const { token } = req.cookies;

  jwt.verify(token, secret, {}, async (error, info) => {
    if (error) return res.status(403).json("invalid token");

    const postDoc = await Post.findById(id);
    if (!postDoc) return res.status(404).json("post not found");

    // Create the new comment object
    const newComment = {
      content,
      author: info.id,
      username: info.username,
      createdAt: new Date(),
    };

    // Push the comment into the comments array
    postDoc.comments.push(newComment);
    await postDoc.save();

    res.json(newComment); // send back the new comment to display immediately
  });
};
// GET USER PROFILE — fetch user info and their posts
exports.getProfile = async (req, res) => {
  const { id } = req.params; // user ID from URL

  try {
    // Find the user but exclude password
    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json("user not found");

    // Find all posts by this user
    const posts = await Post.find({ author: id })
      .populate("author", ["username"])
      .sort({ createdAt: -1 });

    res.json({ user, posts });

  } catch (e) {
    res.status(500).json({ message: "Failed to get profile", error: e.message });
  }
};

// UPDATE PROFILE — update bio and profile photo
exports.updateProfile = [
  uploadMiddleware.single("profilePhoto"),
  async (req, res) => {
    const { token } = req.cookies;

    jwt.verify(token, secret, {}, async (error, info) => {
      if (error) return res.status(403).json("invalid token");

      try {
        const { bio } = req.body;
        const updateData = { bio };

        // If a new photo was uploaded
        if (req.file) {
          const { originalname, path } = req.file;
          const parts = originalname.split(".");
          const ext = parts[parts.length - 1];
          const newPath = path + "." + ext;
          fs.renameSync(path, newPath);
          updateData.profilePhoto = newPath;
        }

        const updatedUser = await User.findByIdAndUpdate(
          info.id,
          updateData,
          { new: true } // return updated document
        ).select("-password");

        res.json(updatedUser);

      } catch (e) {
        res.status(500).json({ message: "Failed to update profile", error: e.message });
      }
    });
  }
]; 
