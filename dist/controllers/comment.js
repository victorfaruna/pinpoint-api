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
exports.replyToComment = exports.unlikeComment = exports.likeComment = exports.getPostComments = exports.createComment = void 0;
const comment_1 = __importDefault(require("../models/comment"));
// Create a new comment for a post
const createComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { postId, content, parentCommentId } = req.body;
    try {
        // Check if the post exists
        // const postExists = await Post.findById(postId);
        // if (!postExists) {
        //   res.status(404).json({ message: "Post not found" });
        //   return;
        // }
        // Create a new comment
        const newComment = new comment_1.default({
            postId,
            userId,
            content,
            parentCommentId, // Optional, for replies
        });
        // Save the comment
        const savedComment = yield newComment.save();
        // Populate the userId field with the actual user data
        const populatedComment = yield savedComment.populate("userId", "username avatarUrl");
        // Update the post (if needed) and save it
        // postExists.comments.push(savedComment._id as unknown as ObjectId);
        // await postExists.save();
        // Return the populated comment in the response
        res.status(201).json(populatedComment);
    }
    catch (error) {
        console.error("Error creating comment:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
});
exports.createComment = createComment;
// Get all comments for a post
const getPostComments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postId } = req.params;
    try {
        // Find all comments for the post
        const comments = yield comment_1.default.find({ postId })
            .populate("userId", "username avatarUrl")
            .sort({ createdAt: 1 }); // Sort by creation time, oldest first
        // Create a map to store comments by their ID
        const commentMap = {};
        // Organize comments into parent and replies
        comments.forEach((comment) => {
            const commentObj = Object.assign(Object.assign({}, comment.toObject()), { replies: [] });
            commentMap[comment._id] = commentObj;
            if (comment.parentCommentId) {
                // If it's a reply, find the parent and add it to the replies array
                const parentComment = commentMap[comment.parentCommentId];
                if (parentComment) {
                    parentComment.replies.push(commentObj);
                }
            }
        });
        // Filter out only the parent comments (no `parentCommentId`)
        const organizedComments = Object.values(commentMap).filter((comment) => !comment.parentCommentId);
        res.status(200).json({ comments: organizedComments });
    }
    catch (error) {
        console.error("Error retrieving comments:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
});
exports.getPostComments = getPostComments;
// Like a comment
const likeComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const userId = req.user._id;
    try {
        const comment = yield comment_1.default.findById(commentId);
        if (!comment) {
            res.status(404).json({ message: "Comment not found" });
            return;
        }
        // Check if the user has already liked the comment
        if (comment.likes.includes(userId)) {
            res.status(400).json({ message: "Comment already liked" });
            return;
        }
        // Add the user to the likes array
        comment.likes.push(userId);
        yield comment.save();
        res.status(200).json({ message: "Comment liked successfully", comment });
    }
    catch (error) {
        console.error("Error liking comment:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
});
exports.likeComment = likeComment;
// Unlike a comment
const unlikeComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const userId = req.user._id;
    try {
        const comment = yield comment_1.default.findById(commentId);
        if (!comment) {
            res.status(404).json({ message: "Comment not found" });
            return;
        }
        // Check if the user has not liked the comment yet
        if (!comment.likes.includes(userId)) {
            res.status(400).json({ message: "Comment not liked yet" });
            return;
        }
        // Remove the user from the likes array
        comment.likes = comment.likes.filter((id) => id.toString() !== userId.toString());
        yield comment.save();
        res.status(200).json({ message: "Comment unliked successfully", comment });
    }
    catch (error) {
        console.error("Error unliking comment:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
});
exports.unlikeComment = unlikeComment;
// Reply to a comment
const replyToComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;
    try {
        // Ensure the parent comment exists
        const parentComment = yield comment_1.default.findById(commentId);
        if (!parentComment) {
            res.status(404).json({ message: "Parent comment not found" });
            return;
        }
        // Create a new reply
        const reply = new comment_1.default({
            postId: parentComment.postId,
            userId: userId,
            content: content,
            parentCommentId: commentId,
        });
        const replyResult = yield reply.save();
        const populatedReply = yield replyResult.populate("userId", "username avatarUrl");
        res.status(201).json(populatedReply);
    }
    catch (error) {
        console.error("Error replying to comment:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
});
exports.replyToComment = replyToComment;
