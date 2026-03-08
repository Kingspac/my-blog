
const express = require('express');
const router = express.Router();
const userController = require("../controllers/userController");

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get("/profile", userController.profile);
router.post("/logout", userController.logout);
router.post("/post", userController.createPost);
router.get("/post", userController.getPosts);
router.get("/post/:id", userController.getPostId);
router.put("/post", userController.editPost);
module.exports = router; 