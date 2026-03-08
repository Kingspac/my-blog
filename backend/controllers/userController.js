
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


/*
const User = require('../models/User');
const Post = require('../models/Post');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require("multer");
const uploadMiddleware = multer({ dest: "uploads" });
const fs = require("fs");

const salt = bcrypt.genSaltSync(10);
const secret = process.env.JWT_SECRET 
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

// ✅ Renamed: createPost handles POST /post
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

exports.editPost = uploadMiddleware.single("file"), async(req,res)=>{
  let newPath = null;
  if(req.fil){
    const { originalname, path } = req.file;
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    const newPath = path + "." + ext;
    fs.renameSync(path, newPath);
  }
  const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (error, info) => {
      if (error) return res.status(403).json("invalid token");
      const {id, title, summary, content } = req.body;
      const postDoc = await Post.findById(id);
      const isAuthor = JSON.Stringify(postDoc.author) === JSON.Stringify();
      if (!author){
        return res.status(400).json("you are not the author");
      }
      await postDoc.update({
        title,
        summary,
        content,
        cover: newPath ? newPath : postDoc.cover,
      });
      res.json({ postDoc });
    });
}

// ✅ Renamed: getPosts handles GET /post
exports.getPosts = async (req, res) => {
  const posts = await Post.find()
    .populate("author", ["username"])
    .sort({ createdAt: -1 })
    .limit(20);
  res.json(posts)
};

exports.getPostId = async (req, res) => {
  const {id} = req.params;
  const postDoc = await Post.findById(id)
    .populate("author", ["username"]);
  res.json(postDoc);
};*/
