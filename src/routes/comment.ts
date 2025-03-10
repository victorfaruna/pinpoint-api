import express from "express";
import { auth } from "../middleware/auth";
import {
  createComment,
  getPostComments,
  likeComment,
  replyToComment,
  unlikeComment,
} from "../controllers/comment";

const router = express.Router();

// Route to create a comment on a post
router.post("/", auth(), createComment);

router.get("/:postId", auth(), getPostComments);

// Route to like a comment
router.put("/:commentId/like", auth(), likeComment);

// Route to unlike a comment
router.put("/:commentId/unlike", auth(), unlikeComment);

// Route to reply to a comment
router.post("/:commentId/reply", auth(), replyToComment);

export default router;
