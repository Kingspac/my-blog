const express = require("express");
const router = express.Router();
const educationController = require("../controllers/educationController");

router.get("/", educationController.getAllEducation);
router.get("/:id", educationController.getSingleEducation);
router.post("/create", educationController.createEducation);
router.put("/:id", educationController.editEducation);
router.delete("/:id", educationController.deleteEducation);
router.put("/:id/like", educationController.likeEducation);

module.exports = router;
