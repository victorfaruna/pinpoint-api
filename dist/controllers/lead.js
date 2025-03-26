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
exports.submitReview = exports.getLeadByItem = exports.getLeadById = exports.getUserLeads = exports.getPartnerLeads = exports.addNoteToLead = exports.updateLeadStatus = exports.createLead = void 0;
const express_validator_1 = require("express-validator");
const lead_1 = __importDefault(require("../models/lead"));
const location_1 = __importDefault(require("../models/location"));
const media_1 = require("../utils/media");
const conversation_1 = __importDefault(require("../models/conversation"));
const item_1 = __importDefault(require("../models/item"));
// Create Lead Controller
const createLead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    // Check for validation errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            message: "Validation errors",
            errors: errors.array(),
        });
        return;
    }
    try {
        const { customerName, email, phone, contactMethod, address, serviceRequestDate, details, location, item, } = req.body;
        const existItem = yield item_1.default.findById(item);
        if (!existItem) {
            res.status(404).json({
                message: "Service not found",
            });
            return;
        }
        const existLocation = yield location_1.default.findById(location);
        if (!existLocation) {
            res.status(404).json({
                message: "Location not found",
            });
            return;
        }
        if ((userId === null || userId === void 0 ? void 0 : userId.toString()) === existItem.user.toString()) {
            res.status(404).json({
                message: "Can not make enquiring about your Item",
            });
            return;
        }
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
        // Create a new Lead instance
        const newLead = new lead_1.default({
            customerName,
            email,
            phone,
            contactMethod,
            address,
            serviceRequestDate: serviceRequestDate || new Date(),
            details,
            location,
            item,
            user: userId,
            partner: existLocation.partnerId,
            uploadedMedia: imageUploadResults.map((image) => image.url),
        });
        // Save the lead to the database
        const newConversation = yield conversation_1.default.create({
            participants: [userId, existItem.user],
            type: "Lead",
            lead: newLead._id,
        });
        newLead.conversationId = newConversation._id;
        const savedLead = yield newLead.save();
        // Respond with the saved lead
        res.status(201).json({
            message: "Lead created successfully",
            lead: savedLead,
        });
    }
    catch (error) {
        console.error("Error creating lead:", error);
        res.status(500).json({
            message: "Server error while creating lead",
            error: error.message,
        });
    }
});
exports.createLead = createLead;
// Update lead status, reason, and offer
const updateLeadStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { leadId } = req.params;
        const { status, reason, time, date, price } = req.body;
        const userId = req.user._id;
        console.log(req.body);
        // Find the lead by ID
        const lead = yield lead_1.default.findById(leadId)
            .populate("item", "name images priceType price priceRange options description")
            .populate("location", "locationName")
            .populate("user", "avatarUrl");
        if (!lead) {
            res.status(404).json({ message: "Lead not found" });
            return;
        }
        const isPartner = lead.partner.toString() === userId.toString();
        const isUser = lead.user._id.toString() === userId.toString();
        console.log(lead);
        // Rules based on the current lead status and user roles
        switch (lead.status) {
            case "Pending":
                if (isUser) {
                    // User can delete lead (mark as Complete with reason "User Deleted")
                    if (status === "Complete" && reason === "User Deleted") {
                        lead.status = "Complete";
                        lead.reason = reason;
                    }
                    else {
                        res.status(400).json({ message: "Invalid action for user" });
                        return;
                    }
                }
                else if (isPartner) {
                    if (status === "Active" && !reason) {
                        // Partner can approve the lead (mark as Active)
                        lead.status = "Active";
                    }
                    else if (status === "Complete" && reason === "Location Declined") {
                        // Partner can decline the lead
                        lead.status = "Complete";
                        lead.reason = "Location Declined";
                    }
                    else {
                        res.status(400).json({ message: "Invalid action for partner" });
                        return;
                    }
                }
                break;
            case "Pool":
                if (isUser) {
                    // User can approve or decline the lead in Pool status
                    if (status === "Active" && !reason) {
                        lead.status = "Active";
                    }
                    else if (status === "Complete" && reason === "User Decline") {
                        lead.status = "Complete";
                        lead.reason = "User Decline";
                    }
                    else {
                        res
                            .status(400)
                            .json({ message: "Invalid action for user in Pool" });
                        return;
                    }
                }
                else if (isPartner) {
                    if (status === "Complete" && reason === "Location Declined") {
                        // Partner can decline the lead in Pool status
                        lead.status = "Complete";
                        lead.reason = "Location Declined";
                    }
                    else {
                        res
                            .status(400)
                            .json({ message: "Invalid action for partner in Pool" });
                        return;
                    }
                }
                break;
            case "Active":
                if (isUser) {
                    res
                        .status(400)
                        .json({ message: "User cannot update an Active lead" });
                    return;
                }
                else if (isPartner) {
                    console.log(status === "Complete" && !!reason);
                    if (status === "Complete" && reason) {
                        // Partner can complete the lead, awaiting customer review
                        lead.status = "Complete";
                        lead.reason = reason;
                        lead.dateCompleted = new Date();
                    }
                    else if (status === "Modify") {
                        lead.modifyDate = date;
                        lead.modifyTime = time;
                        lead.modifyPrice = price;
                    }
                    else {
                        res
                            .status(400)
                            .json({ message: "Invalid action for partner on Active lead" });
                        return;
                    }
                }
                break;
            case "Complete":
                res
                    .status(400)
                    .json({ message: "Lead is already complete and cannot be updated" });
                return;
            default:
                res.status(400).json({ message: "Invalid lead status" });
                return;
        }
        // Save the updated lead
        yield lead.save();
        res.status(200).json({ message: "Lead updated successfully", lead });
    }
    catch (error) {
        console.error("Error updating lead:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
});
exports.updateLeadStatus = updateLeadStatus;
// Add Note to Lead by Partner
const addNoteToLead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { leadId } = req.params;
    const { note } = req.body;
    const partnerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    try {
        // Find the lead
        const lead = yield lead_1.default.findById(leadId);
        if (!lead) {
            res.status(404).json({
                message: "Lead not found",
            });
            return;
        }
        // Ensure the partner assigned to this lead is the one making the request
        if (String(lead.partner) !== String(partnerId)) {
            res.status(403).json({
                message: "You are not authorized to add a note to this lead",
            });
            return;
        }
        // Update the note field
        lead.note = note;
        yield lead.save();
        res.status(200).json({
            message: "Note added successfully",
            lead,
        });
    }
    catch (error) {
        console.error("Error adding note to lead:", error);
        res.status(500).json({
            message: "Server error while adding note to lead",
            error: error.message,
        });
    }
});
exports.addNoteToLead = addNoteToLead;
// Controller to get all leads for a partner
const getPartnerLeads = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const partnerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { status } = req.query;
    try {
        let query = { partner: partnerId };
        if (status) {
            query.status = status;
        }
        const leads = yield lead_1.default.find(query)
            .populate("item", "name priceType images price priceRange")
            .populate("location", "locationName");
        res.status(200).json({
            message: "Partner leads fetched successfully",
            leads,
        });
    }
    catch (error) {
        console.error("Error fetching partner leads:", error);
        res.status(500).json({
            message: "Server error while fetching partner leads",
            error: error.message,
        });
    }
});
exports.getPartnerLeads = getPartnerLeads;
const getUserLeads = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { status } = req.query;
    try {
        // Base query to filter leads by user
        let query = { user: userId };
        // Adjust query based on the status condition
        if (status === "Active") {
            query.$or = [
                { status: "Active" },
                { status: "Complete", reason: "Awaiting Customer Review" },
            ];
        }
        else if (status === "Complete") {
            query.status = "Complete";
            query.reason = { $ne: "Awaiting Customer Review" };
        }
        else if (status) {
            query.status = status;
        }
        const leads = yield lead_1.default.find(query)
            .populate("item", "name images description rating")
            .populate("location", "locationName");
        res.status(200).json({
            message: "Partner leads fetched successfully",
            leads,
        });
    }
    catch (error) {
        console.error("Error fetching user leads:", error);
        res.status(500).json({
            message: "Server error while fetching partner leads",
            error: error.message,
        });
    }
});
exports.getUserLeads = getUserLeads;
const getLeadById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { id } = req.params;
    try {
        const lead = yield lead_1.default.findById(id)
            .populate("item", "name images priceType price priceRange options description type")
            .populate("location", "locationName")
            .populate("user", "avatarUrl");
        res.status(200).json({
            message: "Partner lead fetched successfully",
            lead,
        });
    }
    catch (error) {
        console.error("Error fetching  lead:", error);
        res.status(500).json({
            message: "Server error while fetching  lead",
            error: error.message,
        });
    }
});
exports.getLeadById = getLeadById;
const getLeadByItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { id } = req.params;
    const { status } = req.query;
    try {
        let query = { item: id };
        if (status) {
            query.status = status;
        }
        const lead = yield lead_1.default.findOne(query);
        res.status(200).json({
            message: "Partner lead fetched successfully",
            lead,
        });
    }
    catch (error) {
        console.error("Error fetching  lead:", error);
        res.status(500).json({
            message: "Server error while fetching  lead",
            error: error.message,
        });
    }
});
exports.getLeadByItem = getLeadByItem;
const submitReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const leadId = req.params.id;
    const userId = req.user._id;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            message: "Validation errors",
            errors: errors.array(),
        });
        return;
    }
    const { rating, content } = req.body;
    try {
        const lead = yield lead_1.default.findById(leadId);
        if (!lead) {
            res.status(404).json({
                success: false,
                message: "Lead not found",
            });
            return;
        }
        const location = yield location_1.default.findById(lead.location);
        if (!location) {
            res.status(404).json({
                success: false,
                message: "Location not found",
            });
            return;
        }
        const item = yield item_1.default.findById(lead.item);
        if (!item) {
            res.status(404).json({
                success: false,
                message: "Item not found",
            });
            return;
        }
        const imageUploadPromises = [];
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                const mediaType = file.mimetype.startsWith("image") ? "image" : "video";
                imageUploadPromises.push((0, media_1.uploadMediaToSupabase)(file.buffer, file.filename, mediaType));
            }
        }
        const imageUploadResults = yield Promise.all(imageUploadPromises);
        console.log(imageUploadResults);
        lead.rating = rating;
        lead.reason = "Complete";
        const itemReview = {
            userId: userId,
            content,
            rating,
            image: imageUploadResults[0].url,
        };
        const locationReview = {
            userId: userId,
            title: item.name,
            content,
            image: imageUploadResults[0].url,
            rating,
        };
        (_a = item.reviews) === null || _a === void 0 ? void 0 : _a.push(itemReview);
        (_b = location.reviews) === null || _b === void 0 ? void 0 : _b.push(locationReview);
        // Recalculate the average rating
        const totalServiceRatings = item.reviews.reduce((acc, review) => acc + review.rating, 0);
        item.rating = totalServiceRatings / item.reviews.length;
        // Recalculate the average rating
        const totalLocationRatings = location.reviews.reduce((acc, review) => acc + review.rating, 0);
        location.rating = totalLocationRatings / location.reviews.length;
        // Save the updated item
        yield lead.save();
        yield item.save();
        yield location.save();
        res.status(201).json({
            message: "Review submitted successfully",
        });
    }
    catch (error) {
        console.error("Error submitting review:", error);
        res.status(500).json({
            message: "Server error while submitting review",
            error: error.message,
        });
    }
});
exports.submitReview = submitReview;
