const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/uploadController");
const { isAuthenticated } = require("../middleware/auth");
const wrapAsync = require("../utils/wrapAsync");

// POST /api/upload/listing-images (multiple images)
router.post("/listing-images", isAuthenticated, wrapAsync(uploadController.uploadListingImages));

// POST /api/upload/avatar (single profile avatar)
router.post("/avatar", isAuthenticated, wrapAsync(uploadController.uploadAvatar));

module.exports = router;
