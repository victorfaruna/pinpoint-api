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
exports.deleteAccount = exports.updateUserData = exports.getUserData = void 0;
const user_1 = __importDefault(require("../models/user"));
const media_1 = require("../utils/media");
const common_1 = require("../utils/common");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const getUserData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const user = yield db_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        if (!user || user.length === 0) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.status(200).json({ user: user[0] });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.getUserData = getUserData;
const updateUserData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const { firstName, lastName, state, city, notification } = req.body;
        console.log(req.body);
        const user = yield user_1.default.findById(userId).select("-password -verificationCode -verificationCodeExpires");
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const parsedNotification = (0, common_1.parseJSONField)(notification, "notification");
        const imageUploadPromises = [];
        console.log(req.files);
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                const mediaType = file.mimetype.startsWith("image") ? "image" : "video";
                imageUploadPromises.push((0, media_1.uploadMediaToSupabase)(file.buffer, file.filename, mediaType));
            }
        }
        const imageUploadResults = yield Promise.all(imageUploadPromises);
        console.log(imageUploadResults);
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.state = state || user.state;
        user.city = city || user.city;
        user.notification = parsedNotification || user.notification;
        user.avatarUrl =
            imageUploadResults.length > 0
                ? imageUploadResults[0].url
                : user.avatarUrl;
        yield user.save();
        res.status(200).json({ user });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.updateUserData = updateUserData;
const deleteAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const user = yield user_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        user.delected = true;
        user.save();
        res.json("User delected successfully");
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.deleteAccount = deleteAccount;
