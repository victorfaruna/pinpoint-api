"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = void 0;
const mongoose_1 = require("mongoose");
var UserRole;
(function (UserRole) {
    UserRole["CUSTOMER"] = "customer";
    UserRole["PARTNER"] = "partner";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
// Unified User schema
const UserSchema = new mongoose_1.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    avatarUrl: {
        type: String,
        default: "06450da9-903c-46ca-abd0-59864e8dc266_1729665407294-586722170.jpg",
    }, // Optional profile picture
    verificationCode: { type: String }, // Field to store the verification code
    verificationCodeExpires: { type: Date }, // New field for expiration
    isVerified: { type: Boolean, default: false },
    follower: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    // Customer-specific fields
    followingStores: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Location" }],
    likedProducts: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Product" }],
    reportedStores: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Location" }],
    reportedProducts: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Product" }],
    // Partner-specific fields
    businessLegalName: { type: String },
    businessAddress: { type: String },
    suite: { type: String },
    zipCode: { type: String },
    businessType: {
        type: String,
        enum: ["products", "services", "products & services"],
    },
    einSsn: { type: String },
    products: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Product" }],
    services: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Service" }],
    locations: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Location" }],
    delected: { type: Boolean, default: false },
    notification: { type: Object },
}, {
    timestamps: true,
    discriminatorKey: "role",
});
// Add validation for partner-specific fields when role is 'partner'
UserSchema.pre("save", function (next) {
    // Type assertion to ensure proper typing for this
    const user = this;
    if (user.role === UserRole.PARTNER) {
        const partner = user; // Cast to Partner type
        if (!partner.businessLegalName ||
            !partner.businessAddress ||
            !partner.zipCode ||
            !partner.einSsn ||
            !partner.businessType) {
            return next(new Error("All business fields are required for partners."));
        }
    }
    next();
});
const User = (0, mongoose_1.model)("User", UserSchema);
exports.default = User;
