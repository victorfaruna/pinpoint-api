"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const conversationSchema = new mongoose_1.Schema({
    participants: [{ type: String, required: true }],
    type: { type: String, enum: ["Chat", "Lead"], required: true },
    closed: { type: Boolean, default: false },
    lead: { type: mongoose_1.Schema.Types.ObjectId, ref: "Lead" },
}, { timestamps: true });
const Conversation = (0, mongoose_1.model)("Conversation", conversationSchema);
exports.default = Conversation;
