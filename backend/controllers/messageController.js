const Message = require("../models/Message");
const jwt = require("jsonwebtoken");

const secret = process.env.JWT_SECRET;

// GET ALL MESSAGES
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find()
      .sort({ createdAt: 1 }) // oldest first
      .limit(200);
    res.json(messages);
  } catch (e) {
    res.status(500).json({ message: "Failed to get messages", error: e.message });
  }
};

// GET MESSAGE COUNT - used for notification badge
exports.getMessageCount = async (req, res) => {
  try {
    const count = await Message.countDocuments();
    res.json({ count });
  } catch (e) {
    res.status(500).json({ message: "Failed to get count", error: e.message });
  }
};

// SEND A MESSAGE
exports.sendMessage = async (req, res) => {
  const { token } = req.cookies;

  jwt.verify(token, secret, {}, async (error, info) => {
    if (error) return res.status(403).json("Please login to send a message");

    try {
      const { content } = req.body;

      if (!content.trim()) {
        return res.status(400).json("Message cannot be empty");
      }

      const message = await Message.create({
        content,
        author: info.id,
        username: info.username,
      });

      res.json(message);
    } catch (e) {
      res.status(500).json({ message: "Failed to send message", error: e.message });
    }
  });
};

// DELETE A MESSAGE - only own messages
exports.deleteMessage = async (req, res) => {
  const { id } = req.params;
  const { token } = req.cookies;

  jwt.verify(token, secret, {}, async (error, info) => {
    if (error) return res.status(403).json("invalid token");

    const message = await Message.findById(id);
    if (!message) return res.status(404).json("not found");

    const isOwner = message.author.toString() === info.id.toString();
    if (!isOwner) return res.status(403).json("not authorized");

    await message.deleteOne();
    res.json("deleted");
  });
};
