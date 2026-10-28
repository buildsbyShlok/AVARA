const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");
const plmPlugin = passportLocalMongoose.default || passportLocalMongoose;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        trim: true,
        default: ""
    },
    bio: {
        type: String,
        trim: true,
        default: ""
    },
    location: {
        type: String,
        trim: true,
        default: ""
    },
    phone: {
        type: String,
        trim: true,
        default: ""
    },
    profilePicture: {
        url: {
            type: String,
            default: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
        },
        filename: {
            type: String,
            default: "default_avatar"
        }
    }
}, { timestamps: true });

userSchema.plugin(plmPlugin);

module.exports = mongoose.model("User", userSchema);
