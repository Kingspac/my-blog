
const User = require('../models/User');
const Post = require('../models/Post');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require("multer");
const uploadMiddleware = multer({ dest: "uploads" });
const fs = require("fs");

const salt = bcrypt.genSaltSync(10);
const secret = process.env.JWT_SECRET || "your-secret-here";

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

  // ✅ Guard against user not found
  if (!userDoc) return res.status(400).json("wrong credentials");

  const passOk = bcrypt.compareSync(password, userDoc.password);

  if (passOk) {
    jwt.sign({ username, id: userDoc._id }, secret, {}, (error, token) => {
      if (error) throw error;
      res.cookie("token", token).json({
        id: userDoc._id, username,
      });
    });
  } else {
    res.status(400).json("wrong credentials");
  }
};

exports.profile = (req, res) => {
  const { token } = req.cookies;

  // ✅ Guard against missing token
  if (!token) return res.status(401).json("no token");

  jwt.verify(token, secret, {}, (error, info) => {
    if (error) return res.status(403).json("invalid token");
    res.json(info);
  });
};

exports.logout = (req, res) => {
  res.cookie("token", "").json("ok");
};

// ✅ Fixed: export as array so middleware and handler are both called
exports.post = [
  uploadMiddleware.single("files"), // matches frontend field name
  async (req, res) => {
    const {originalname, path} = req.file;
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    const  newPath = path + "." + ext;
    fs.renameSync(path, newPath);
    
    const {title, summary, content} = req.body;
    const postDoc = await Post.create({
      title,
      summary,
      content,
      cover:newPath,
    });
    
    res.json({postDoc});
  }
];

exports.post = async (req,res)=>{
  res.json(await Post.find());
}

