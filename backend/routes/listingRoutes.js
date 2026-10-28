const express = require("express");
const router = express.Router();
const listingController = require("../controllers/listingController");
const reviewRoutes = require("./reviewRoutes");
const { isAuthenticated, isOwner } = require("../middleware/auth");
const { validateListing } = require("../middleware/validation");
const wrapAsync = require("../utils/wrapAsync");

// Sub-route for reviews
router.use("/:id/reviews", reviewRoutes);

// GET /api/listings - Get all listings (supports ?search= and ?country=)
router.get("/", wrapAsync(listingController.getAllListings));

// GET /api/listings/:id - Get single listing details
router.get("/:id", wrapAsync(listingController.getListingById));

// POST /api/listings - Create listing
router.post(
    "/",
    isAuthenticated,
    validateListing,
    wrapAsync(listingController.createListing)
);

// PUT /api/listings/:id - Update listing
router.put(
    "/:id",
    isAuthenticated,
    wrapAsync(isOwner),
    validateListing,
    wrapAsync(listingController.updateListing)
);

// DELETE /api/listings/:id - Delete listing
router.delete(
    "/:id",
    isAuthenticated,
    wrapAsync(isOwner),
    wrapAsync(listingController.deleteListing)
);

module.exports = router;
