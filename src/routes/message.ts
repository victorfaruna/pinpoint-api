// routes/messages.ts

import express from "express";
import {
  getConversationById,
  getMessages,
  getUserConversations,
  sendMessage,
  startConversation,
} from "../controllers/message";
import { auth } from "../middleware/auth";

const router = express.Router();

router.get("/:conversationId", auth(), getMessages);
router.get("/conversation/:conversationId", auth(), getConversationById);
router.get("/conversations/:type", auth(), getUserConversations);

router.post("/send", auth(), sendMessage);
router.post("/conversations/start", auth(), startConversation);

// router.post("/conversation", startConversation);

export default router;
