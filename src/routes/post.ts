import express from "express";
import {
  createPost,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  reportPost,
  getAllPost,
} from "../controllers/post";
import { auth } from "../middleware/auth";
import multer from "multer";

const router = express.Router();

const storage = multer.memoryStorage();

// Multer config
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// Create a post (Only partners)
router.post("/", auth(), upload.array("media"), createPost);
router.get("/", getAllPost);

// Get a post by ID
router.get("/:id", auth(), getPostById);

// Update a post (Only owner can update)
router.put("/:id", upload.array("media"), auth(["partner"]), updatePost);

// Delete a post (Only owner can delete)
router.delete("/:id", auth(["partner"]), deletePost);

// Like a post (Any authenticated user)
router.post("/:id/like", auth(), likePost);

// Report a post (Any authenticated user)
router.post("/:id/report", auth(), reportPost);

export default router;
