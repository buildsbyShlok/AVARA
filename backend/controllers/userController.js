const User = require("../models/User");
const Listing = require("../models/Listing");
const ExpressError = require("../utils/ExpressError");

const formatProfile = (user, listings = [], privateProfile = true) => ({
    _id: user._id,
    username: user.username,
    ...(privateProfile ? { email: user.email, phone: user.phone || "" } : {}),
    name: user.name || user.username,
    bio: user.bio || "Travel • Create • Discover",
    location: user.location || "Global Nomad",
    profilePicture: user.profilePicture || {
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        filename: "default_avatar"
    },
    createdAt: user.createdAt,
    destinationsCount: listings.length,
    destinations: listings
});

// GET /api/users/profile - Get authenticated user's profile with their destinations
const getMyProfile = async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ExpressError(404, "User not found.");
    }
    const listings = await Listing.find({ owner: user._id }).sort({ createdAt: -1 });

    res.json({
        success: true,
        profile: formatProfile(user, listings)
    });
};

// GET /api/users/:username - Public profile of any user with their public listings
const getUserProfile = async (req, res) => {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) {
        throw new ExpressError(404, `User @${username} not found.`);
    }
    const listings = await Listing.find({ owner: user._id }).sort({ createdAt: -1 });

    res.json({
        success: true,
        profile: formatProfile(user, listings, false)
    });
};

// PUT /api/users/profile - Update personal details & avatar
const updateProfile = async (req, res) => {
    const { name, bio, location, phone, profilePicture } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name.trim();
    if (bio !== undefined) updateData.bio = bio.trim();
    if (location !== undefined) updateData.location = location.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (profilePicture) {
        updateData.profilePicture = {
            url: profilePicture.url || profilePicture,
            filename: profilePicture.filename || "user_avatar"
        };
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateData },
        { new: true, runValidators: true }
    );

    const listings = await Listing.find({ owner: updatedUser._id });

    res.json({
        success: true,
        message: "Profile updated successfully.",
        profile: formatProfile(updatedUser, listings)
    });
};

// PUT /api/users/change-password - Secure password change
const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        throw new ExpressError(400, "Old password and new password are both required.");
    }
    if (newPassword.length < 6) {
        throw new ExpressError(400, "New password must be at least 6 characters.");
    }

    const user = await User.findById(req.user._id);
    await user.changePassword(oldPassword, newPassword);

    res.json({
        success: true,
        message: "Password updated successfully."
    });
};

// PUT /api/users/username - Change username with validation and uniqueness check
const changeUsername = async (req, res) => {
    const rawUsername = req.body.username;
    if (!rawUsername || typeof rawUsername !== "string") {
        throw new ExpressError(400, "Username is required.");
    }

    const newUsername = rawUsername.trim();

    if (newUsername.length < 3 || newUsername.length > 30) {
        throw new ExpressError(400, "Username must be between 3 and 30 characters.");
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(newUsername)) {
        throw new ExpressError(400, "Username can only contain letters, numbers, and underscores.");
    }

    if (newUsername.toLowerCase() === req.user.username.toLowerCase()) {
        throw new ExpressError(400, "New username must be different from your current username.");
    }

    // Check uniqueness (case-insensitive)
    const existing = await User.findOne({
        username: { $regex: new RegExp(`^${newUsername}$`, "i") },
        _id: { $ne: req.user._id }
    });

    if (existing) {
        throw new ExpressError(400, `Username '@${newUsername}' is already taken.`);
    }

    const user = await User.findById(req.user._id);
    user.username = newUsername;
    await user.save();

    // Synchronize current request and passport session store
    req.user.username = newUsername;
    if (req.session && req.session.passport) {
        req.session.passport.user = newUsername;
        await new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }

    const listings = await Listing.find({ owner: user._id }).sort({ createdAt: -1 });

    const updatedFormattedUser = {
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name || "",
        bio: user.bio || "",
        location: user.location || "",
        phone: user.phone || "",
        profilePicture: user.profilePicture
    };

    res.json({
        success: true,
        message: `Username successfully updated to @${newUsername}.`,
        user: updatedFormattedUser,
        profile: formatProfile(user, listings)
    });
};

module.exports = {
    getMyProfile,
    getUserProfile,
    updateProfile,
    changePassword,
    changeUsername
};
