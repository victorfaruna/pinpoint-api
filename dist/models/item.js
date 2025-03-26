"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// Common Schemas for Reusable Sub-Documents
const ItemOptionSchema = new mongoose_1.Schema({
    optionCategory: { type: String, required: true },
    optionName: { type: String, required: true },
});
const ReviewSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, required: true },
    rating: { type: Number, required: true },
    image: { type: String },
}, { timestamps: true });
// Base Item Schema
const ItemSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    images: { type: [String], required: true },
    location: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Location" }],
    mainCategory: { type: [String], required: true },
    category: { type: [String], required: true },
    subCategory: { type: [String] },
    options: { type: [ItemOptionSchema] },
    reviews: { type: [ReviewSchema] },
    rating: { type: Number, default: 0 },
}, { timestamps: true, discriminatorKey: "type" });
// Create Base Model
const Item = mongoose_1.default.model("Item", ItemSchema);
exports.default = Item;
