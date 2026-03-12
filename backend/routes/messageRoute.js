const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");

router.get("/", messageController.getMessages);
router.get("/count", messageController.getMessageCount);
router.post("/", messageController.sendMessage);
router.delete("/:id", messageController.deleteMessage);

module.exports = router;
