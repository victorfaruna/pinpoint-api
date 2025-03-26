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
exports.reportPost = exports.likePost = exports.deletePost = exports.updatePost = exports.getPostById = exports.getAllPost = exports.createPost = void 0;
const media_1 = require("../utils/media");
const report_1 = __importStar(require("../models/report"));
const post_1 = __importDefault(require("../models/post"));
const supabase_1 = __importDefault(require("../config/supabase"));
const createPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { content, location } = req.body;
    const userId = req.user._id;
    // Handle media files
    const mediaUploadPromises = [];
    if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
            const mediaType = file.mimetype.startsWith("image") ? "image" : "video";
            mediaUploadPromises.push((0, media_1.uploadMediaToSupabase)(file.buffer, file.filename, mediaType));
        }
    }
    try {
        const mediaUploadResults = yield Promise.all(mediaUploadPromises);
        // const newPost = new Post({
        //   userId,
        //   location,
        //   content,
        //   media: mediaUploadResults,
        // });
        const { data: newPost, error: insertError } = yield supabase_1.default
            .from("posts")
            .insert({
            userId,
            location,
            content,
            media: mediaUploadResults,
        });
        if (insertError) {
            console.log(insertError);
            res.status(500).json({ message: "Internal Server Error" });
            return;
        }
        // await newPost.save();
        res
            .status(201)
            .json({ message: "Post created successfully", post: newPost });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.createPost = createPost;
const getAllPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // const posts = await Post.find()
        //   .populate("location", "locationName address images")
        //   .populate("userId", "locationName address images")
        //   .sort({ createdAt: -1 });
        const { data: posts, error } = yield supabase_1.default
            .from("posts")
            .select(`
    *,
    location:locationId(locationName, address, images),
    userId(locationName, address, images)
  `)
            .order("createdAt", { ascending: false });
        res.status(200).json(posts);
        return;
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error", error });
    }
});
exports.getAllPost = getAllPost;
// Get a single post by ID
const getPostById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const post = yield post_1.default.findById(id)
            .populate("comments")
            .populate("likes")
            .populate("reports");
        if (!post) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        res.status(200).json(post);
        return;
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.getPostById = getPostById;
// Update a post (only owner can update)
const updatePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { content, existingMedia } = req.body;
    const userId = req.user._id;
    try {
        const post = yield post_1.default.findById(id);
        if (!post) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        // Ensure only the owner of the post can update it
        if (post.userId.toString() !== userId.toString()) {
            res.status(403).json({ message: "Unauthorized to update this post" });
            return;
        }
        // Update content
        post.content = content || post.content;
        // Handle media update
        const currentMedia = post.media || [];
        const newMediaUrls = existingMedia || []; // URLs of media to keep
        // Identify media to delete
        const mediaToDelete = currentMedia.filter((media) => !newMediaUrls.includes(media.url));
        // Delete media from S3
        yield Promise.all(mediaToDelete.map((media) => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, media_1.deleteMediaFromSupabase)(media.url); // Function to delete the file from S3
        })));
        // Handle new media uploads
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            const mediaUploads = yield Promise.all(req.files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
                const mediaType = file.mimetype.startsWith("image")
                    ? "image"
                    : "video";
                const uploadResult = yield (0, media_1.uploadMediaToSupabase)(file.buffer, file.filename, mediaType);
                return { url: uploadResult.Location, type: mediaType }; // Adjust based on your uploadMediaToS3
            })));
            // Update post media with new uploaded URLs
            post.media = [...newMediaUrls, ...mediaUploads];
        }
        else {
            // If no new files, just keep the existing ones that are wanted
            post.media = newMediaUrls;
        }
        yield post.save();
        res.status(200).json({ message: "Post updated successfully", post });
        return;
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.updatePost = updatePost;
// Delete a post (only owner can delete)
const deletePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const userId = req.user._id;
    try {
        const post = yield post_1.default.findById(id);
        if (!post) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        // Ensure only the owner of the post can delete it
        if (post.userId.toString() !== userId.toString()) {
            res.status(403).json({ message: "Unauthorized to delete this post" });
            return;
        }
        // Delete media files associated with the post
        if (post.media && post.media.length > 0) {
            yield Promise.all(post.media.map((media) => __awaiter(void 0, void 0, void 0, function* () {
                yield (0, media_1.deleteMediaFromSupabase)(media.url); // Function to delete the file from S3
            })));
        }
        // Delete the post from the database
        yield post.deleteOne();
        res
            .status(200)
            .json({ message: "Post and associated media deleted successfully" });
        return;
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.deletePost = deletePost;
// Like or Unlink a post
const likePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const userId = req.user._id;
    try {
        const post = yield post_1.default.findById(id);
        if (!post) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        // Check if the user has already liked the post
        if (post.likes.includes(userId)) {
            // If user has already liked, remove their ID from the likes array (unlike)
            post.likes = post.likes.filter((like) => like.toString() !== userId.toString());
            yield post.save();
            res.status(200).json({ message: "Post unliked successfully", post });
        }
        else {
            // If user hasn't liked, add their ID to the likes array (like)
            post.likes.push(userId);
            yield post.save();
            res.status(200).json({ message: "Post liked successfully", post });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.likePost = likePost;
// Report a post
const reportPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params; // Post ID
    const { reason, description } = req.body; // Reason and optional description for the report
    const userId = req.user._id; // Reporter ID
    try {
        // Find the post to be reported
        const post = yield post_1.default.findById(id);
        if (!post) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        // Create a new report
        const newReport = new report_1.default({
            userId,
            reportType: report_1.ReportType.POST, // Indicating this is a post report
            reportId: id, // The ID of the post being reported
            reason,
            description,
        });
        // Save the report in the database
        const savedReport = yield newReport.save();
        // Save the post after adding the report ID
        yield post.save();
        res
            .status(201)
            .json({ message: "Post reported successfully", report: savedReport });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.reportPost = reportPost;
