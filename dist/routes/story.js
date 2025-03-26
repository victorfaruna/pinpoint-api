"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const story_1 = require("../controllers/story");
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
// Multer config
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 5MB
});
const router = (0, express_1.Router)();
router.get("/", story_1.getAllStoriesGroupedByUser);
router.post("/", (0, auth_1.auth)(), upload.array("media"), story_1.createStory);
router.post("/:storyId/view", (0, auth_1.auth)(), story_1.viewStory);
router.post("/:storyId/like", (0, auth_1.auth)(), story_1.likeStory);
router.post("/:storyId/unlike", (0, auth_1.auth)(), story_1.unlikeStory);
exports.default = router;
