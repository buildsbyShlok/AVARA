const User = require("../models/User");
const passport = require("passport");

const formatUser = (user) => ({
    _id: user._id,
    username: user.username,
    email: user.email,
    name: user.name || "",
    bio: user.bio || "",
    location: user.location || "",
    phone: user.phone || "",
    profilePicture: user.profilePicture || {
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        filename: "default_avatar"
    }
});

const getMe = (req, res) => {
    if (req.isAuthenticated() && req.user) {
        return res.json({
            success: true,
            user: formatUser(req.user)
        });
    }
    return res.json({
        success: true,
        user: null
    });
};

const signup = async (req, res, next) => {
    try {
        const { username, email, password, name, bio, location } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Username, email, and password are required."
            });
        }

        const newUser = new User({
            email,
            username,
            name: name || username,
            bio: bio || "Explorer & Residence Curator",
            location: location || ""
        });
        const registeredUser = await User.register(newUser, password);

        req.login(registeredUser, (err) => {
            if (err) return next(err);
            return res.status(201).json({
                success: true,
                message: "Welcome to AVARA.",
                user: formatUser(registeredUser)
            });
        });
    } catch (e) {
        return res.status(400).json({
            success: false,
            message: e.message || "Failed to register user."
        });
    }
};

const login = (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: info ? info.message : "Invalid username or password."
            });
        }
        req.login(user, (err) => {
            if (err) return next(err);
            return res.json({
                success: true,
                message: "Welcome back to AVARA.",
                user: formatUser(user)
            });
        });
    })(req, res, next);
};

const logout = (req, res, next) => {
    req.logOut((err) => {
        if (err) return next(err);
        req.session.destroy((destroyError) => {
            if (destroyError) return next(destroyError);
            res.clearCookie("connect.sid");
            return res.json({
                success: true,
                message: "Logged out from AVARA."
            });
        });
    });
};

module.exports = {
    getMe,
    signup,
    login,
    logout
};
