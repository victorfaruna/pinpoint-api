"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ReviewSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true },
    content: { type: String, required: true },
    rating: { type: Number, required: true },
    image: { type: String },
}, { timestamps: true });
// Mongoose Schema Definition
const locationSchema = new mongoose_1.Schema({
    partnerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    locationName: {
        type: String,
        required: true,
    },
    images: [{ type: String }],
    address: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    categories: {
        type: [String],
    },
    hoursOfOperation: [
        {
            day: { type: String, required: true },
            isOpen: { type: Boolean, required: true },
            closeTime: { type: String, required: true },
            openTime: { type: String, required: true },
        },
    ],
    menu: [{ type: String }],
    poll: {
        question: { type: String },
        options: [{ type: String }],
    },
    coordinates: {
        type: {
            type: String,
            enum: ["Point"], // GeoJSON object type
            required: true,
            default: "Point",
        },
        coordinates: {
            type: [Number], // Array of numbers: [longitude, latitude]
            required: true,
        },
    },
    reviews: { type: [ReviewSchema] },
    rating: { type: Number, default: 0 },
    followers: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    likes: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });
// Create a 2dsphere index on the coordinates field
locationSchema.index({ coordinates: "2dsphere" });
// Create and export the model
const Location = (0, mongoose_1.model)("Location", locationSchema);
exports.default = Location;
