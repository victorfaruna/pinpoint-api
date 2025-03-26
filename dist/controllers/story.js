"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unlikeStory = exports.likeStory = exports.viewStory = exports.getAllStoriesGroupedByUser = exports.createStory = void 0;
const story_1 = __importDefault(require("../models/story"));
const media_1 = require("../utils/media");
const supabase_1 = __importDefault(require("../config/supabase"));
const stories_1 = require("../db/schema/stories");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const locations_1 = require("../db/schema/locations");
const drizzle_orm_1 = require("drizzle-orm");
// Create a new story
const createStory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { mediaType, caption, location } = req.body;
        // Assuming you are using some kind of authentication middleware to set req.user
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            res.status(401).json({ message: "User not authenticated" });
            return;
        }
        const mediaUploadPromises = [];
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                const mediaType = file.mimetype.startsWith("image") ? "image" : "video";
                mediaUploadPromises.push((0, media_1.uploadMediaToSupabase)(file.buffer, file.filename, mediaType));
            }
        }
        const mediaUploadResults = yield Promise.all(mediaUploadPromises);
        console.log(mediaUploadResults);
        // Create a new story
        // const newStory = new Story({
        //   userId: userId,
        //   location,
        //   media: mediaUploadResults[0],
        //   mediaType,
        //   caption,
        // });
        const { data: savedStory } = yield supabase_1.default.from("stories").insert({
            userId: userId,
            location,
            media: mediaUploadResults[0],
            mediaType,
            caption,
        });
        // Save the story to the database
        // const savedStory = await newStory.save();
        res
            .status(201)
            .json({ message: "Story created successfully", story: savedStory });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error", error });
    }
});
exports.createStory = createStory;
// Get all stories, grouped by user
// export const getAllStoriesGroupedByUser = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     // Fetch stories that are not archived or deleted and created within the last 24 hours
//     const stories = await Story.find({
//       createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Stories within 24 hours
//     })
//       .populate("userId", "username avatarUrl")
//       .populate("location", "images locationName address");
//     // .sort({ createdAt: -1 });
//     // Group stories by user
//     const groupedStories = stories.reduce((acc: any, story: any) => {
//       const userId = story.userId._id;
//       if (!acc[userId]) {
//         acc[userId] = {
//           _id: userId,
//           user: {
//             username: story.userId.username,
//             avatarUrl: story.userId.avatarUrl,
//           },
//           stories: [],
//         };
//       }
//       acc[userId].stories.push({
//         _id: story._id,
//         media: story.media,
//         mediaType: story.mediaType,
//         caption: story.caption,
//         createdAt: story.createdAt,
//         views: story.views,
//         likes: story.likes,
//         location: story.location,
//       });
//       return acc;
//     }, {});
//     // Convert the grouped object into an array for easier frontend handling
//     const result = Object.values(groupedStories);
//     res.status(200).json(result);
//   } catch (error) {
//     res.status(500).json({ message: "Internal server error", error });
//   }
// };
const getAllStoriesGroupedByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Calculate timestamp for 24 hours ago
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        // Fetch stories with user and location details
        const fetchedStories = yield db_1.db
            .select({
            id: stories_1.stories.id,
            media: stories_1.stories.media,
            mediaType: stories_1.stories.mediaType,
            caption: stories_1.stories.caption,
            createdAt: stories_1.stories.createdAt,
            views: stories_1.stories.views,
            likes: stories_1.stories.likes,
            user: {
                id: schema_1.users.id,
                username: schema_1.users.username,
                avatarUrl: schema_1.users.avatarUrl,
            },
            location: {
                id: locations_1.locations.id,
                images: locations_1.locations.images,
                locationName: locations_1.locations.locationName,
                address: locations_1.locations.address,
            },
        })
            .from(stories_1.stories)
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(stories_1.stories.userId, schema_1.users.id))
            .leftJoin(locations_1.locations, (0, drizzle_orm_1.eq)(stories_1.stories.locationId, locations_1.locations.id))
            .where((0, drizzle_orm_1.gte)(stories_1.stories.createdAt, twentyFourHoursAgo));
        // Group stories by user
        const groupedStories = fetchedStories.reduce((acc, story) => {
            const userId = story.user.id;
            if (!acc[userId]) {
                acc[userId] = {
                    _id: userId,
                    user: {
                        username: story.user.username,
                        avatarUrl: story.user.avatarUrl,
                    },
                    stories: [],
                };
            }
            acc[userId].stories.push({
                _id: story.id,
                media: story.media,
                mediaType: story.mediaType,
                caption: story.caption,
                createdAt: story.createdAt,
                views: story.views,
                likes: story.likes,
                location: story.location,
            });
            return acc;
        }, {});
        // Convert to array for frontend
        const result = Object.values(groupedStories);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});
exports.getAllStoriesGroupedByUser = getAllStoriesGroupedByUser;
const viewStory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const storyId = req.params.storyId;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const story = yield story_1.default.findById(storyId);
        if (!story) {
            res.status(404).json({ message: "Story not found" });
            return;
        }
        if (story.views.includes(userId)) {
            res.status(400).json({ message: "You have already viewed this story" });
            return;
        }
        // Add user to views
        story.views.push(userId);
        yield story.save();
        res.status(200).json({ message: "Story viewed successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});
exports.viewStory = viewStory;
// Like a story
const likeStory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const storyId = req.params.storyId;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const story = yield story_1.default.findById(storyId);
        if (!story) {
            res.status(404).json({ message: "Story not found" });
            return;
        }
        if (story.likes.includes(userId)) {
            res.status(400).json({ message: "You have already liked this story" });
            return;
        }
        // Add user to likes
        story.likes.push(userId);
        yield story.save();
        res.status(200).json({ message: "Story liked successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});
exports.likeStory = likeStory;
// unLike a story
const unlikeStory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const storyId = req.params.storyId;
        const userId = req.user._id;
        const story = yield story_1.default.findById(storyId);
        if (!story) {
            res.status(404).json({ message: "Story not found" });
            return;
        }
        if (!story.likes.includes(userId)) {
            res.status(400).json({ message: "You have not like this story" });
            return;
        }
        // Add user to likes
        story.likes = story.likes.filter((id) => id.toString() !== userId.toString());
        yield story.save();
        res.status(200).json({ message: "Story unliked successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});
exports.unlikeStory = unlikeStory;
