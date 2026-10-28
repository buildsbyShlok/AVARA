const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./Review.js");

const DEFAULT_IMAGE_URL = "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60";

const listingSchema = new Schema({
    title: { 
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    // Single image for legacy compatibility
    image: {
        filename: {
            type: String,
            default: "listingimage",
        },
        url: {
            type: String,
            default: DEFAULT_IMAGE_URL,
            set: (v) => (!v || v.trim() === "") ? DEFAULT_IMAGE_URL : v,
        },
    },
    // Modern multiple images gallery
    images: [
        {
            url: { type: String, required: true },
            filename: { type: String, default: "residence_photo" },
            isCover: { type: Boolean, default: false }
        }
    ],
    price: {
        type: Number,
        min: 0,
        required: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    country: {
        type: String,
        required: true,
        trim: true
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review",
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    }
}, { timestamps: true });

// Sync single image and multiple images before saving
listingSchema.pre("save", function (next) {
    if (this.images && this.images.length > 0) {
        const coverImg = this.images.find(img => img.isCover) || this.images[0];
        if (coverImg) {
            this.image = {
                url: coverImg.url,
                filename: coverImg.filename || "listingimage"
            };
        }
    } else if (this.image && this.image.url) {
        this.images = [{
            url: this.image.url,
            filename: this.image.filename || "listingimage",
            isCover: true
        }];
    }
    next();
});

// Cascading delete: delete all associated reviews when a listing is deleted
listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing && listing.reviews && listing.reviews.length) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
