const express = require("express");
const router = express.Router({ mergeParams: true });
const reviewController = require("../controllers/reviewController");
const { isAuthenticated, isReviewAuthor } = require("../middleware/auth");
const { validateReview } = require("../middleware/validation");
const wrapAsync = require("../utils/wrapAsync");

// POST /api/listings/:id/reviews
router.post(
    "/",
    isAuthenticated,
    validateReview,
    wrapAsync(reviewController.createReview)
);

// DELETE /api/listings/:id/reviews/:reviewId
router.delete(
    "/:reviewId",
    isAuthenticated,
    wrapAsync(isReviewAuthor),
    wrapAsync(reviewController.deleteReview)
);

module.exports = router;
