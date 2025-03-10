import { Router } from "express";
import { auth } from "../middleware/auth";
import {
  createStory,
  getAllStoriesGroupedByUser,
  likeStory,
  unlikeStory,
  viewStory,
} from "../controllers/story";
import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

// Multer config
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 5MB
});

const router = Router();

router.get("/", getAllStoriesGroupedByUser);
router.post("/", auth(), upload.array("media"), createStory);
router.post("/:storyId/view", auth(), viewStory);
router.post("/:storyId/like", auth(), likeStory);
router.post("/:storyId/unlike", auth(), unlikeStory);

export default router;
