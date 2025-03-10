import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import Comment from "../models/comment";
import Post from "../models/content";
import { ObjectId } from "mongoose";

// Create a new comment for a post
export const createComment = async (req: CustomRequest, res: Response) => {
  const userId = req.user!._id;
  const { postId, content, parentCommentId } = req.body;

  try {
    // Check if the post exists
    // const postExists = await Post.findById(postId);
    // if (!postExists) {
    //   res.status(404).json({ message: "Post not found" });
    //   return;
    // }

    // Create a new comment
    const newComment = new Comment({
      postId,
      userId,
      content,
      parentCommentId, // Optional, for replies
    });

    // Save the comment
    const savedComment = await newComment.save();

    // Populate the userId field with the actual user data
    const populatedComment = await savedComment.populate(
      "userId",
      "username avatarUrl"
    );

    // Update the post (if needed) and save it
    // postExists.comments.push(savedComment._id as unknown as ObjectId);
    // await postExists.save();

    // Return the populated comment in the response
    res.status(201).json(populatedComment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Get all comments for a post
export const getPostComments = async (req: CustomRequest, res: Response) => {
  const { postId } = req.params;

  try {
    // Find all comments for the post
    const comments: any = await Comment.find({ postId })
      .populate("userId", "username avatarUrl")
      .sort({ createdAt: 1 }); // Sort by creation time, oldest first

    // Create a map to store comments by their ID
    const commentMap: Record<string, any> = {};

    // Organize comments into parent and replies
    comments.forEach(
      (comment: {
        toObject: () => any;
        _id: string | number;
        parentCommentId: string | number;
      }) => {
        const commentObj = { ...comment.toObject(), replies: [] };
        commentMap[comment._id] = commentObj;

        if (comment.parentCommentId) {
          // If it's a reply, find the parent and add it to the replies array
          const parentComment = commentMap[comment.parentCommentId];
          if (parentComment) {
            parentComment.replies.push(commentObj);
          }
        }
      }
    );

    // Filter out only the parent comments (no `parentCommentId`)
    const organizedComments = Object.values(commentMap).filter(
      (comment) => !comment.parentCommentId
    );

    res.status(200).json({ comments: organizedComments });
  } catch (error) {
    console.error("Error retrieving comments:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Like a comment
export const likeComment = async (req: CustomRequest, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user!._id;

  try {
    const comment = await Comment.findById(commentId);

    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    // Check if the user has already liked the comment
    if (comment.likes.includes(userId as unknown as ObjectId)) {
      res.status(400).json({ message: "Comment already liked" });
      return;
    }

    // Add the user to the likes array
    comment.likes.push(userId as unknown as ObjectId);
    await comment.save();

    res.status(200).json({ message: "Comment liked successfully", comment });
  } catch (error) {
    console.error("Error liking comment:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Unlike a comment
export const unlikeComment = async (req: CustomRequest, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user!._id;

  try {
    const comment = await Comment.findById(commentId);

    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    // Check if the user has not liked the comment yet
    if (!comment.likes.includes(userId as unknown as ObjectId)) {
      res.status(400).json({ message: "Comment not liked yet" });
      return;
    }

    // Remove the user from the likes array
    comment.likes = comment.likes.filter(
      (id) => id.toString() !== userId.toString()
    );
    await comment.save();

    res.status(200).json({ message: "Comment unliked successfully", comment });
  } catch (error) {
    console.error("Error unliking comment:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Reply to a comment
export const replyToComment = async (req: CustomRequest, res: Response) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const userId = req.user!._id;

  try {
    // Ensure the parent comment exists
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      res.status(404).json({ message: "Parent comment not found" });
      return;
    }

    // Create a new reply
    const reply = new Comment({
      postId: parentComment.postId,
      userId: userId,
      content: content,
      parentCommentId: commentId,
    });

    const replyResult = await reply.save();

    const populatedReply = await replyResult.populate(
      "userId",
      "username avatarUrl"
    );

    res.status(201).json(populatedReply);
  } catch (error) {
    console.error("Error replying to comment:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};
