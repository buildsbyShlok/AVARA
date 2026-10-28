const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const ExpressError = require("../utils/ExpressError");

const ALLOWED_MIME_TYPES = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif"
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function parseDataUrl(dataUrl) {
    if (typeof dataUrl !== "string") {
        throw new ExpressError(400, "Image data must be a string.");
    }
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new ExpressError(400, "Invalid image data format. Must be a valid image base64 data URI.");
    }
    const mimeType = matches[1].toLowerCase();
    const ext = ALLOWED_MIME_TYPES[mimeType];
    if (!ext) {
        throw new ExpressError(400, `Unsupported image format (${mimeType}). Supported formats: JPG, PNG, WEBP, GIF.`);
    }
    const buffer = Buffer.from(matches[2], "base64");
    if (buffer.length > MAX_FILE_SIZE_BYTES) {
        throw new ExpressError(400, "Image size exceeds 10MB limit.");
    }
    return { buffer, ext, mimeType };
}

// POST /api/upload/listing-images
const uploadListingImages = async (req, res) => {
    const { images } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
        throw new ExpressError(400, "No images provided for upload.");
    }

    if (images.length > 8) throw new ExpressError(400, "A gallery supports up to 8 images.");
    // Validate the complete batch before creating any files.
    const prepared = images.map(item => {
        const rawData = typeof item === "string" ? item : (item?.dataUrl || item?.url);
        if (typeof rawData !== "string") throw new ExpressError(400, "Each image needs a URL or image data.");
        const isExistingUrl = /^https?:\/\//.test(rawData) || /^\/uploads\/listings\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp|gif)$/.test(rawData);
        return { rawData, parsed: isExistingUrl ? null : parseDataUrl(rawData) };
    });
    const uploadedResults = [];
    const uploadDir = path.join(path.resolve(__dirname, "..", process.env.UPLOAD_DIR || "uploads"), "listings");
    if (prepared.some(image => image.parsed)) await fs.mkdir(uploadDir, { recursive: true });

    for (let i = 0; i < images.length; i++) {
        const item = images[i];
        const { rawData, parsed } = prepared[i];
        
        // Preserve external URLs and previously uploaded gallery images.
        if (!parsed) {
            uploadedResults.push({
                url: rawData,
                filename: item.filename || `external_photo_${i + 1}`,
                isCover: !!item.isCover
            });
            continue;
        }

        // Process data URL upload
        const { buffer, ext } = parsed;
        const uniqueId = crypto.randomBytes(8).toString("hex");
        const filename = `residence_${Date.now()}_${uniqueId}.${ext}`;
        const filePath = path.join(uploadDir, filename);

        await fs.writeFile(filePath, buffer);

        uploadedResults.push({
            url: `/uploads/listings/${filename}`,
            filename,
            isCover: !!item.isCover
        });
    }

    res.json({
        success: true,
        message: `Successfully processed ${uploadedResults.length} image(s).`,
        images: uploadedResults
    });
};

// POST /api/upload/avatar
const uploadAvatar = async (req, res) => {
    const { dataUrl, filename: originalName } = req.body;
    if (typeof dataUrl !== "string" || !dataUrl) {
        throw new ExpressError(400, "No image data provided for avatar.");
    }

    if (dataUrl.startsWith("http://") || dataUrl.startsWith("https://")) {
        return res.json({
            success: true,
            url: dataUrl,
            filename: originalName || "avatar_external"
        });
    }

    const { buffer, ext } = parseDataUrl(dataUrl);
    const uploadDir = path.join(path.resolve(__dirname, "..", process.env.UPLOAD_DIR || "uploads"), "avatars");
    await fs.mkdir(uploadDir, { recursive: true });

    const uniqueId = crypto.randomBytes(8).toString("hex");
    const filename = `avatar_${Date.now()}_${uniqueId}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    await fs.writeFile(filePath, buffer);

    res.json({
        success: true,
        message: "Avatar uploaded successfully.",
        url: `/uploads/avatars/${filename}`,
        filename
    });
};

module.exports = {
    uploadListingImages,
    uploadAvatar
};
