const express = require("express");
const router = express.Router();
const {
  getAllMedia,
  getSingleMedia,
  uploadMedia,
  deleteMedia,
  likeMedia,
  addComment,
} = require("../controllers/mediaController");

router.get("/", getAllMedia);
router.get("/:id", getSingleMedia);
router.post("/", uploadMedia);
router.delete("/:id", deleteMedia);
router.put("/:id/like", likeMedia);
router.post("/:id/comment", addComment);

module.exports = router;
