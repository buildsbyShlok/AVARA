const Listing = require("../models/Listing");
const ExpressError = require("../utils/ExpressError");

const literalSearch = (value) => {
    if (value === undefined) return null;
    if (typeof value !== "string") throw new ExpressError(400, "Search filters must be text.");
    const text = value.trim();
    return text ? new RegExp(text.replace(/[.*+?^{}$()|[\]\\]/g, "\\$&"), "i") : null;
};

const normalizeListingImages = (listing) => {
    const obj = listing.toObject ? listing.toObject() : { ...listing };
    if (!obj.images || obj.images.length === 0) {
        if (obj.image && obj.image.url) {
            obj.images = [{
                url: obj.image.url,
                filename: obj.image.filename || "listingimage",
                isCover: true
            }];
        } else {
            obj.images = [{
                url: "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
                filename: "listingimage",
                isCover: true
            }];
        }
    }
    const cover = obj.images.find(image => image.isCover) || obj.images[0];
    obj.image = { url: cover.url, filename: cover.filename || "listingimage" };
    return obj;
};

const getAllListings = async (req, res) => {
    const { search, country } = req.query;
    const searchPattern = literalSearch(search);
    const countryPattern = literalSearch(country);
    let query = {};

    if (searchPattern) {
        const regex = searchPattern;
        query.$or = [
            { title: regex },
            { location: regex },
            { country: regex },
            { description: regex }
        ];
    }

    if (countryPattern) {
        query.country = countryPattern;
    }

    const rawListings = await Listing.find(query)
        .populate("owner", "username name profilePicture")
        .sort({ _id: -1 });

    const listings = rawListings.map(normalizeListingImages);

    res.json({
        success: true,
        count: listings.length,
        listings
    });
};

const getListingById = async (req, res) => {
    const { id } = req.params;
    const rawListing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
                select: "username name profilePicture"
            }
        })
        .populate("owner", "username name bio location profilePicture");

    if (!rawListing) {
        throw new ExpressError(404, "Destination not found.");
    }

    const listing = normalizeListingImages(rawListing);

    // Calculate aggregate rating
    let avgRating = 0;
    if (listing.reviews && listing.reviews.length > 0) {
        const sum = listing.reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
        avgRating = Number((sum / listing.reviews.length).toFixed(1));
    }

    res.json({
        success: true,
        listing,
        avgRating
    });
};

const createListing = async (req, res) => {
    const listingData = req.validatedListing;

    // Handle multiple images if provided
    if (listingData.images && listingData.images.length > 0) {
        listingData.images = listingData.images.map((img, idx) => ({
            url: typeof img === "string" ? img : img.url,
            filename: typeof img === "object" ? (img.filename || `residence_${idx}`) : "residence_photo",
            isCover: typeof img === "object" ? !!img.isCover : idx === 0
        }));
    }

    // Ensure cover image structure
    if (!listingData.images || listingData.images.length === 0) {
        if (typeof listingData.image === "string") {
            listingData.image = {
                filename: "listingimage",
                url: listingData.image
            };
        } else if (!listingData.image || !listingData.image.url || !listingData.image.url.trim()) {
            listingData.image = {
                filename: "listingimage",
                url: "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60"
            };
        }
    }

    const newListing = new Listing(listingData);
    newListing.owner = req.user._id;
    await newListing.save();

    await newListing.populate("owner", "username name profilePicture");

    res.status(201).json({
        success: true,
        message: "New destination published to AVARA.",
        listing: normalizeListingImages(newListing)
    });
};

const updateListing = async (req, res) => {
    const listingData = req.validatedListing;

    if (listingData.images && listingData.images.length > 0) {
        listingData.images = listingData.images.map((img, idx) => ({
            url: typeof img === "string" ? img : img.url,
            filename: typeof img === "object" ? (img.filename || `residence_${idx}`) : "residence_photo",
            isCover: typeof img === "object" ? !!img.isCover : idx === 0
        }));
    }

    // Save the authorized document so the existing gallery/cover hook runs.
    const updatedListing = req.listing;
    if (typeof listingData.image === "string") {
        listingData.image = { url: listingData.image, filename: "listingimage" };
    }
    if (listingData.image && !listingData.images) {
        updatedListing.images = [];
    }
    updatedListing.set(listingData);
    await updatedListing.save();
    await updatedListing.populate("owner", "username name profilePicture");

    res.json({
        success: true,
        message: "Destination updated successfully.",
        listing: normalizeListingImages(updatedListing)
    });
};

const deleteListing = async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);

    res.json({
        success: true,
        message: "Destination removed from AVARA."
    });
};

module.exports = {
    getAllListings,
    getListingById,
    createListing,
    updateListing,
    deleteListing
};
