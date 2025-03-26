"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const content_1 = __importDefault(require("./content"));
const postSchema = new mongoose_1.Schema({
    content: { type: String },
    media: [
        {
            url: { type: String, required: true },
            type: { type: String, enum: ["image", "video"], required: true },
        },
    ],
});
const Post = content_1.default.discriminator("Post", postSchema);
exports.default = Post;
