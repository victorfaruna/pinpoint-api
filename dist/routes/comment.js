"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const comment_1 = require("../controllers/comment");
const router = express_1.default.Router();
// Route to create a comment on a post
router.post("/", (0, auth_1.auth)(), comment_1.createComment);
router.get("/:postId", (0, auth_1.auth)(), comment_1.getPostComments);
// Route to like a comment
router.put("/:commentId/like", (0, auth_1.auth)(), comment_1.likeComment);
// Route to unlike a comment
router.put("/:commentId/unlike", (0, auth_1.auth)(), comment_1.unlikeComment);
// Route to reply to a comment
router.post("/:commentId/reply", (0, auth_1.auth)(), comment_1.replyToComment);
exports.default = router;
