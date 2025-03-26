"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.likeContent = exports.getContentByUser = exports.getContentByLocation = void 0;
const content_1 = __importDefault(require("../models/content"));
// Controller to get contents by location
const getContentByLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { locationId } = req.params;
        // Validate locationId presence
        if (!locationId) {
            res.status(400).json({ message: "Location ID is required" });
            return;
        }
        // Fetch contents related to the locationId
        const contents = yield content_1.default.find({ location: locationId })
            .populate("userId", "username avatarUrl")
            .populate("location", "images locationName address")
            .sort({ createdAt: -1 });
        res.status(200).json(contents);
    }
    catch (error) {
        console.error("Error fetching contents for location:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
});
exports.getContentByLocation = getContentByLocation;
// Controller to get contents by user
const getContentByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        // Validate userId presence
        if (!userId) {
            res.status(400).json({ message: "User ID is required" });
            return;
        }
        // Fetch contents related to the userId
        const contents = yield content_1.default.find({ userId })
            .populate("userId", "username avatarUrl")
            .populate("location", "images locationName address")
            .sort({ createdAt: -1 });
        res.status(200).json(contents);
    }
    catch (error) {
        console.error("Error fetching contents for user:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
});
exports.getContentByUser = getContentByUser;
// Like or Unlink a content
const likeContent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const userId = req.user._id;
    try {
        const content = yield content_1.default.findById(id);
        if (!content) {
            res.status(404).json({ message: "Content not found" });
            return;
        }
        // Check if the user has already liked the content
        if (content.likes.includes(userId)) {
            // If user has already liked, remove their ID from the likes array (unlike)
            content.likes = content.likes.filter((like) => like.toString() !== userId.toString());
            yield content.save();
            res
                .status(200)
                .json({ message: "Content unliked successfully", content });
        }
        else {
            // If user hasn't liked, add their ID to the likes array (like)
            content.likes.push(userId);
            yield content.save();
            res.status(200).json({ message: "Content liked successfully", content });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.likeContent = likeContent;
