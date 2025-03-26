"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const content_1 = __importDefault(require("./content"));
const storySchema = new mongoose_1.Schema({
    caption: { type: String, maxlength: 300 },
    views: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    media: {
        url: { type: String, required: true },
        type: { type: String, enum: ["image", "video"], required: true },
    },
});
const Story = content_1.default.discriminator("Story", storySchema);
exports.default = Story;
