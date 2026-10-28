const Listing = require("../models/Listing");
const Review = require("../models/Review");
const ExpressError = require("../utils/ExpressError");

const createReview = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        throw new ExpressError(404, "Listing not found.");
    }

    const newReview = new Review(req.validatedReview);
    newReview.author = req.user._id;

    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();

    await newReview.populate("author", "username name profilePicture");

    res.status(201).json({
        success: true,
        message: "Review added successfully!",
        review: newReview
    });
};

const deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;

    await Listing.findByIdAndUpdate(id, {
        $pull: { reviews: reviewId }
    });

    await Review.findByIdAndDelete(reviewId);

    res.json({
        success: true,
        message: "Review deleted successfully."
    });
};

module.exports = {
    createReview,
    deleteReview
};
