const Joi = require("joi");
const ExpressError = require("../utils/ExpressError");

const galleryImageSchema = Joi.alternatives().try(
    Joi.string().trim().required(),
    Joi.object({
        _id: Joi.string().optional(),
        url: Joi.string().trim().required(),
        filename: Joi.string().allow("", null),
        isCover: Joi.boolean()
    })
);

const listingJoiSchema = Joi.object({
    title: Joi.string().trim().required(),
    description: Joi.string().allow("", null),
    location: Joi.string().trim().required(),
    country: Joi.string().trim().required(),
    price: Joi.number().min(0).required(),
    image: Joi.alternatives().try(
        Joi.object({
            filename: Joi.string().allow("", null),
            url: Joi.string().allow("", null)
        }),
        Joi.string().allow("", null)
    ).optional(),
    images: Joi.array().items(galleryImageSchema).min(1).max(8).optional()
});

const reviewJoiSchema = Joi.object({
    comment: Joi.string().trim().required(),
    rating: Joi.number().integer().min(1).max(5).required()
});

const validateListing = (req, res, next) => {
    // Support both { listing: { ... } } and direct payload { title, description, ... }
    const dataToValidate = req.body.listing ? { ...req.body.listing } : { ...req.body };
    if (req.body.images !== undefined) dataToValidate.images = req.body.images;
    const { error, value } = listingJoiSchema.validate(dataToValidate);

    if (error) {
        const msg = error.details.map(el => el.message).join(",");
        throw new ExpressError(400, msg);
    }
    // Normalize req.body.listing
    req.validatedListing = value;
    next();
};

const validateReview = (req, res, next) => {
    // Support both { review: { ... } } and direct payload { comment, rating }
    const dataToValidate = req.body.review ? req.body.review : req.body;
    const { error, value } = reviewJoiSchema.validate(dataToValidate);

    if (error) {
        const msg = error.details.map(el => el.message).join(",");
        throw new ExpressError(400, msg);
    }
    req.validatedReview = value;
    next();
};

module.exports = {
    validateListing,
    validateReview
};
