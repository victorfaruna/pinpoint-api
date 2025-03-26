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
exports.startConversation = exports.getConversationById = exports.getUserConversations = exports.getMessages = exports.sendMessage = void 0;
const message_1 = __importDefault(require("../models/message"));
const user_1 = __importDefault(require("../models/user"));
const conversation_1 = __importDefault(require("../models/conversation"));
const mongoose_1 = __importDefault(require("mongoose"));
// Send a message
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { content, image, conversationId, participantId, type } = req.body;
        const sender = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        let conversation;
        // Create or find conversation
        if (!conversationId) {
            if (!type) {
                yield session.abortTransaction();
                session.endSession();
                res.status(400).json({
                    message: "Type is required",
                });
                return;
            }
            if (type === "Chat" && !participantId) {
                yield session.abortTransaction();
                session.endSession();
                res.status(400).json({
                    message: "participantId is required",
                });
                return;
            }
            let query = { participants: { $all: [sender] }, type };
            if (participantId) {
                query = { participants: { $all: [sender, participantId] }, type };
            }
            conversation = yield conversation_1.default.findOneAndUpdate(query, {
                $setOnInsert: {
                    participants: participantId ? [sender, participantId] : [sender],
                    type,
                },
            }, { upsert: true, new: true, session });
        }
        else {
            conversation = yield conversation_1.default.findById(conversationId).session(session);
        }
        if (!conversation) {
            yield session.abortTransaction();
            session.endSession();
            res.status(400).json({
                message: "Unable to find or create conversation",
            });
            return;
        }
        // Ensure sender is part of conversation
        if (!conversation.participants.includes(sender)) {
            yield session.abortTransaction();
            session.endSession();
            res.status(400).json({
                message: "Invalid conversation or unauthorized access",
            });
            return;
        }
        // Determine the receiver from the conversation if participants exist
        let receiver;
        if (conversation.participants.length > 1) {
            receiver = conversation.participants.find((participant) => participant !== sender.toString());
            if (!receiver) {
                yield session.abortTransaction();
                session.endSession();
                res.status(400).json({
                    message: "Receiver not found in the conversation",
                });
                return;
            }
        }
        // Create and save message
        const newMessage = new message_1.default({
            sender,
            conversationId: conversation._id,
            receiver,
            image,
            content,
        });
        const savedMessage = yield newMessage.save({ session });
        // Access the io instance from the app
        // const io = req.app.get("io");
        // Fetch receiver user and admin users in parallel
        // const [receiverUser, adminUsers] = await Promise.all([
        //   receiver ? User.findById(receiver).session(session) : null,
        //   type !== "Chat" ? User.find({ role: "Admin" }).session(session) : [],
        // ]);
        // if (receiverUser && receiverUser.socketId) {
        //   if (receiverUser.socketId) {
        //     io.to(receiverUser.socketId).emit("message", savedMessage, type);
        //   } else if (conversation.isGuest) {
        //     //send email
        //   }
        // } else if (type !== "Chat") {
        //   adminUsers.forEach((user: any) => {
        //     console.log(user.username);
        //     if (user.socketId) {
        //       io.to(user.socketId).emit("message", savedMessage, type);
        //     }
        //   });
        // }
        // Commit the transaction
        yield session.commitTransaction();
        session.endSession();
        // Respond with the saved message
        res.status(201).json({ message: savedMessage });
    }
    catch (error) {
        // Abort the transaction in case of errors
        yield session.abortTransaction();
        session.endSession();
        // Handle errors
        console.error("Error sending message:", error);
        res.status(500).json({ message: "Failed sending message", error });
    }
});
exports.sendMessage = sendMessage;
// Retrieve messages between two users
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { conversationId } = req.params;
        const userId = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a._id;
        // Find the conversation and ensure it exists
        const conversation = yield conversation_1.default.findById(conversationId);
        if (!conversation) {
            res
                .status(404)
                .json({ status: false, message: "Conversation not found" });
            return;
        }
        // Check if the user is a participant in the conversation
        const isParticipant = conversation.participants.includes(userId);
        if (!isParticipant) {
            res.status(403).json({ status: false, message: "Access forbidden" });
            return;
        }
        // Retrieve and return messages
        const messages = yield message_1.default.find({ conversationId }).sort({
            createdAt: 1,
        });
        res.json({ status: true, messages });
    }
    catch (error) {
        console.error("Error getting messages:", error);
        res.status(500).json({ message: "Error getting messages", error });
    }
});
exports.getMessages = getMessages;
// Get list of conversations for a user
const getUserConversations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { type } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const conversations = yield conversation_1.default.find({
            participants: userId,
            type,
            closed: false,
        }).sort({ createdAt: -1 });
        const conversationsWithDetails = yield Promise.all(conversations.map((conversation) => __awaiter(void 0, void 0, void 0, function* () {
            const lastMessage = yield message_1.default.findOne({
                conversationId: conversation._id,
            }).sort({ createdAt: -1 });
            const otherUserId = conversation.participants.find((id) => id !== userId.toString());
            const otherUser = otherUserId
                ? yield user_1.default.findById(otherUserId).select("username avatarUrl")
                : null;
            return Object.assign(Object.assign({}, conversation.toObject()), { lastMessage, otherUser: otherUser
                    ? { username: otherUser.username, image: otherUser.avatarUrl }
                    : undefined });
        })));
        const conversationsWithUnreadCount = yield Promise.all(conversationsWithDetails.map((conversation) => __awaiter(void 0, void 0, void 0, function* () {
            const unreadMessages = yield message_1.default.find({
                conversationId: conversation._id,
                receiver: userId,
                read: false,
            });
            const unreadCount = unreadMessages.length;
            return Object.assign(Object.assign({}, conversation), { unreadCount });
        })));
        res.json({ conversations: conversationsWithUnreadCount });
    }
    catch (error) {
        console.error("Error fetching user conversations by type:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.getUserConversations = getUserConversations;
const getConversationById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { conversationId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        // Find the conversation by ID and check if the user is a participant
        const conversation = yield conversation_1.default.findById(conversationId);
        if (!conversation) {
            res.status(404).json({ error: "Conversation not found" });
            return;
        }
        // Get the last message in the conversation
        const lastMessage = yield message_1.default.findOne({
            conversationId: conversation._id,
        }).sort({ createdAt: -1 });
        // Identify the other user in the conversation
        const otherUserId = conversation.participants.find((id) => id !== userId.toString());
        const otherUser = otherUserId
            ? yield user_1.default.findById(otherUserId).select("username avatarUrl")
            : null;
        // Fetch unread messages for the current user
        const unreadMessages = yield message_1.default.find({
            conversationId: conversation._id,
            receiver: userId,
            read: false,
        });
        const unreadCount = unreadMessages.length;
        // Prepare the response
        const conversationWithDetails = Object.assign(Object.assign({}, conversation.toObject()), { lastMessage, otherUser: otherUser
                ? { username: otherUser.username, image: otherUser.avatarUrl }
                : undefined, unreadCount });
        res.json({ conversation: conversationWithDetails });
    }
    catch (error) {
        console.error("Error fetching conversation by ID:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.getConversationById = getConversationById;
const startConversation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { participantId, type } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        // Check if the conversation already exists
        let existingConversation = yield conversation_1.default.findOne({
            participants: { $all: [userId, participantId] },
            type,
        });
        if (existingConversation) {
            res.json({ status: true, conversation: existingConversation }); // Return existing conversation
            return;
        }
        // If conversation doesn't exist, create a new one
        const newConversation = yield conversation_1.default.create({
            participants: [userId, participantId],
            type,
        });
        res.status(201).json({ status: true, conversation: newConversation });
    }
    catch (error) {
        console.log(error);
        res
            .status(500)
            .json({ status: false, message: "Error Starting conversations", error });
    }
});
exports.startConversation = startConversation;
