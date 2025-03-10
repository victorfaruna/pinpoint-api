import express from "express";
import {
  getContentByLocation,
  getContentByUser,
  likeContent,
} from "../controllers/content";
import { auth } from "../middleware/auth";

const router = express.Router();
router.get("/location/:locationId", getContentByLocation);
router.get("/user/:userId", getContentByUser);
router.post("/:id/like", auth(), likeContent);

export default router;
