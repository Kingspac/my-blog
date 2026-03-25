const express = require('express');
const router = express.Router();
const userController = require("../controllers/userController");

// ===== AUTH =====
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get("/profile", userController.profile);
router.post("/logout", userController.logout);

// ===== POSTS =====
router.post("/post", userController.createPost);
router.get("/post", userController.getPosts);
router.get("/post/:id", userController.getPostId);
router.put("/post", userController.editPost);
router.delete("/post/:id", userController.deletePost);
router.put("/post/:id/like", userController.likePost);
router.post("/post/:id/comment", userController.addComment);

// ===== PROFILE =====
router.get("/profile/:id", userController.getProfile);
router.put("/profile/:id", userController.updateProfile);

// ===== SEARCH USERS =====
router.get("/users", userController.getUsers);

// ===== DELETE ACCOUNT =====
router.delete("/account", userController.deleteAccount);

module.exports = router;
 