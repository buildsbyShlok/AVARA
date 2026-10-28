const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const wrapAsync = require("../utils/wrapAsync");

// GET /api/auth/me - Check current user session
router.get("/me", authController.getMe);

// POST /api/auth/signup - Register new user
router.post("/signup", wrapAsync(authController.signup));

// POST /api/auth/login - Log in existing user
router.post("/login", authController.login);

// POST /api/auth/logout - Log out current user
router.post("/logout", authController.logout);

module.exports = router;
