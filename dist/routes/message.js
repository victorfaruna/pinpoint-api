"use strict";
// routes/messages.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const message_1 = require("../controllers/message");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get("/:conversationId", (0, auth_1.auth)(), message_1.getMessages);
router.get("/conversation/:conversationId", (0, auth_1.auth)(), message_1.getConversationById);
router.get("/conversations/:type", (0, auth_1.auth)(), message_1.getUserConversations);
router.post("/send", (0, auth_1.auth)(), message_1.sendMessage);
router.post("/conversations/start", (0, auth_1.auth)(), message_1.startConversation);
// router.post("/conversation", startConversation);
exports.default = router;
