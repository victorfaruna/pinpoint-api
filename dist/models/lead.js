"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const LeadSchema = new mongoose_1.Schema({
    customerName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String },
    contactMethod: {
        type: String,
        enum: ["text", "email", "call"],
    },
    address: { type: String },
    serviceRequestDate: { type: Date, required: true },
    details: { type: String, required: true },
    location: { type: mongoose_1.Schema.Types.ObjectId, ref: "Location" },
    item: { type: mongoose_1.Schema.Types.ObjectId, ref: "Item" },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    conversationId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Conversation" },
    partner: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    uploadedMedia: { type: [String], default: [] },
    status: {
        type: String,
        enum: ["Pending", "Active", "Complete", "Pool", "Website Click"],
        default: "Pending",
    },
    reason: { type: String },
    note: { type: String },
    modifyDate: { type: String },
    modifyTime: { type: String },
    modifyPrice: { type: String },
    rating: { type: Number, default: 0 },
    dateCompleted: { type: String },
}, { timestamps: true });
// Create the Lead model
const Lead = mongoose_1.default.model("Lead", LeadSchema);
exports.default = Lead;
