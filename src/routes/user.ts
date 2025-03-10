import express from "express";
import {
  deleteAccount,
  getUserData,
  updateUserData,
} from "../controllers/user";
import { auth } from "../middleware/auth";
import multer from "multer";
import path from "path";

const router = express.Router();

const storage = multer.memoryStorage();

// Multer config
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Get logged-in user data route
router.get("/profile", auth(), getUserData);
router.put("/", auth(), upload.array("media"), updateUserData);
router.delete("/", auth(), deleteAccount);

export default router;
