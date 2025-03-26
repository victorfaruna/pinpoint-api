"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const post_1 = require("../controllers/post");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
const storage = multer_1.default.memoryStorage();
// Multer config
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});
// Create a post (Only partners)
router.post("/", (0, auth_1.auth)(), upload.array("media"), post_1.createPost);
router.get("/", post_1.getAllPost);
// Get a post by ID
router.get("/:id", (0, auth_1.auth)(), post_1.getPostById);
// Update a post (Only owner can update)
router.put("/:id", upload.array("media"), (0, auth_1.auth)(["partner"]), post_1.updatePost);
// Delete a post (Only owner can delete)
router.delete("/:id", (0, auth_1.auth)(["partner"]), post_1.deletePost);
// Like a post (Any authenticated user)
router.post("/:id/like", (0, auth_1.auth)(), post_1.likePost);
// Report a post (Any authenticated user)
router.post("/:id/report", (0, auth_1.auth)(), post_1.reportPost);
exports.default = router;
