const express = require("express");
const router = express.Router();
const educationController = require("../controllers/educationController");

// ===== PUBLIC =====
router.get("/", educationController.getAllEducation);
router.get("/:id", educationController.getSingleEducation);
router.put("/:id/like", educationController.likeEducation);

// ===== LOGGED IN =====
router.post("/", educationController.createEducation);
router.put("/:id", educationController.editEducation);
router.delete("/:id", educationController.deleteEducation);

// ===== ADMIN ONLY =====
router.get("/admin/pending", educationController.getPendingEducation);
router.put("/:id/approve", educationController.approveEducation);
router.put("/:id/reject", educationController.rejectEducation);

module.exports = router;
