"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostType = exports.MediaType = void 0;
const mongoose_1 = require("mongoose");
var MediaType;
(function (MediaType) {
    MediaType["IMAGE"] = "image";
    MediaType["VIDEO"] = "video";
})(MediaType || (exports.MediaType = MediaType = {}));
var PostType;
(function (PostType) {
    PostType["POST"] = "post";
    PostType["STORY"] = "story";
})(PostType || (exports.PostType = PostType = {}));
const contenSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    location: { type: mongoose_1.Schema.Types.ObjectId, ref: "Location" },
    likes: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true, discriminatorKey: "type" });
const Content = (0, mongoose_1.model)("Content", contenSchema);
exports.default = Content;
