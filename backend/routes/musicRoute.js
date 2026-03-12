const express = require("express");
const router = express.Router();
const musicController = require("../controllers/musicController");

router.get("/", musicController.getAllMusic);
router.get("/:id", musicController.getSingleMusic);
router.post("/upload", musicController.uploadMusic);
router.delete("/:id", musicController.deleteMusic);
router.put("/:id/like", musicController.likeMusic);

module.exports = router;
