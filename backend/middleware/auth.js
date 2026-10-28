const Listing = require("../models/Listing");
const Review = require("../models/Review");

const isAuthenticated = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({
            success: false,
            message: "Authentication required. Please log in."
        });
    }
    next();
};

const isOwner = async (req, res, next) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        return res.status(404).json({
            success: false,
            message: "Listing not found."
        });
    }
    if (!listing.owner || !listing.owner.equals(req.user._id)) {
        return res.status(403).json({
            success: false,
            message: "Permission denied. You do not own this listing."
        });
    }
    req.listing = listing;
    next();
};

const isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const listing = await Listing.findById(id);
    if (!listing || !listing.reviews.some(review => review.equals(reviewId))) {
        return res.status(404).json({ success: false, message: "Review not found on this listing." });
    }
    const review = await Review.findById(reviewId);
    if (!review) {
        return res.status(404).json({
            success: false,
            message: "Review not found."
        });
    }
    if (!review.author || !review.author.equals(req.user._id)) {
        return res.status(403).json({
            success: false,
            message: "Permission denied. You did not write this review."
        });
    }
    next();
};

module.exports = {
    isAuthenticated,
    isOwner,
    isReviewAuthor
};
