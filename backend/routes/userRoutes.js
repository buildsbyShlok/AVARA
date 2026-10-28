const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { isAuthenticated } = require("../middleware/auth");
const wrapAsync = require("../utils/wrapAsync");

// GET /api/users/profile - Get current user profile
router.get("/profile", isAuthenticated, wrapAsync(userController.getMyProfile));

// PUT /api/users/profile - Update current user profile
router.put("/profile", isAuthenticated, wrapAsync(userController.updateProfile));

// PUT /api/users/change-password - Change current user password
router.put("/change-password", isAuthenticated, wrapAsync(userController.changePassword));

// PUT /api/users/username - Change current user username
router.put("/username", isAuthenticated, wrapAsync(userController.changeUsername));

// GET /api/users/:username - Get public profile
router.get("/:username", wrapAsync(userController.getUserProfile));

module.exports = router;
