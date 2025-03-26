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
exports.deleteService = exports.submitReview = exports.getServiceById = exports.getServicesForLocation = exports.getAllServices = exports.updateService = exports.createService = void 0;
const express_validator_1 = require("express-validator");
const service_1 = __importDefault(require("../models/service"));
const media_1 = require("../utils/media");
const common_1 = require("../utils/common");
// Create Service Controller
const createService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    // Check for validation errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: "Validation errors",
            errors: errors.array(),
        });
        return;
    }
    try {
        const { name, description, duration, price, priceRange, priceType, location, mainCategory, category, subCategory, options, homeService, serviceRadius, } = req.body;
        console.log(priceRange);
        const priceRangeJson = (0, common_1.parseJSONField)(priceRange, "priceRange");
        const imageUploadPromises = [];
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                const mediaType = file.mimetype.startsWith("image") ? "image" : "video";
                imageUploadPromises.push((0, media_1.uploadMediaToSupabase)(file.buffer, file.filename, mediaType));
            }
        }
        const imageUploadResults = yield Promise.all(imageUploadPromises);
        console.log(imageUploadResults);
        // Create a new Service instance
        const newService = new service_1.default({
            user: userId,
            name,
            description,
            duration,
            priceType,
            priceRange: priceRangeJson,
            price,
            images: imageUploadResults.map((image) => image.url),
            location,
            mainCategory,
            category,
            subCategory,
            options,
            homeService,
            serviceRadius,
        });
        // Save the service to the database
        const savedService = yield newService.save();
        // Respond with the saved service
        res.status(201).json({
            message: "Service created successfully",
            service: savedService,
        });
    }
    catch (error) {
        console.error("Error creating service:", error);
        res.status(500).json({
            message: "Server error while creating service",
            error: error.message,
        });
    }
});
exports.createService = createService;
// Update Service Controller
const updateService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const serviceId = req.params.id;
    const { name, description, duration, price, location, mainCategory, category, existingImages, subCategory, options, homeService, serviceRadius, } = req.body;
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
        // Find the service by ID
        const service = yield service_1.default.findById(serviceId);
        if (!service) {
            res.status(404).json({
                message: "Service not found",
            });
            return;
        }
        // Check if the user is the owner of the service
        if (service.user.toString() !== userId) {
            res.status(403).json({
                message: "You are not authorized to update this service",
            });
            return;
        }
        // Handle media update
        const currentImage = service.images || [];
        const newImageUrls = existingImages || [];
        // Identify media to delete
        const imageToDelete = currentImage.filter((image) => !newImageUrls.includes(image));
        // Delete image from S3
        yield Promise.all(imageToDelete.map((image) => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, media_1.deleteMediaFromSupabase)(image); // Function to delete the file from S3
        })));
        // Handle media uploads if any files are provided
        const imageUploadPromises = [];
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                const mediaType = file.mimetype.startsWith("image") ? "image" : "video";
                imageUploadPromises.push((0, media_1.uploadMediaToSupabase)(file.buffer, file.filename, mediaType));
            }
        }
        const imageUploadResults = yield Promise.all(imageUploadPromises);
        const uploadedImages = imageUploadResults.map((media) => media.url);
        // Update service fields
        service.name = name || service.name;
        service.description = description || service.description;
        service.duration = duration || service.duration;
        service.price = price || service.price;
        if (uploadedImages.length > 0) {
            service.images = [...newImageUrls, ...uploadedImages];
        }
        else {
            service.images = newImageUrls;
        }
        service.location = location || service.location;
        service.mainCategory = mainCategory || service.mainCategory;
        service.category = category || service.category;
        service.subCategory = subCategory || service.subCategory;
        service.options = options || service.options;
        service.homeService =
            homeService !== undefined ? homeService : service.homeService;
        service.serviceRadius = serviceRadius || service.serviceRadius;
        // Save the updated service
        const updatedService = yield service.save();
        // Respond with the updated service
        res.status(200).json({
            message: "Service updated successfully",
            service: updatedService,
        });
    }
    catch (error) {
        console.error("Error updating service:", error);
        res.status(500).json({
            message: "Server error while updating service",
            error: error.message,
        });
    }
});
exports.updateService = updateService;
const getAllServices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, search = "", category = [], subCategory = [], minPrice, maxPrice, options, } = req.query;
        // Convert page and limit to integers
        const pageNumber = parseInt(page, 10);
        const pageSize = parseInt(limit, 10);
        // Build query for filtering
        let query = {};
        // Search by product name or description
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { mainCategory: { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } },
                { subCategory: { $regex: search, $options: "i" } },
            ];
        }
        // Filter by category (if it's an array)
        if (category && Array.isArray(category) && category.length > 0) {
            query.category = { $in: category }; // Matches any of the categories
        }
        // Filter by subCategory (if it's an array)
        if (subCategory && Array.isArray(subCategory) && subCategory.length > 0) {
            query.subCategory = { $in: subCategory }; // Matches any of the subcategories
        }
        // if (inShopOnly) query.inShopOnly = inShopOnly === "true";
        if (options) {
            const optionFilters = JSON.parse(options);
            query.options = { $elemMatch: optionFilters };
        }
        // Filter by price range
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice)
                query.price.$gte = Number(minPrice); // Minimum price filter
            if (maxPrice)
                query.price.$lte = Number(maxPrice); // Maximum price filter
        }
        const services = yield service_1.default.find(query)
            .populate("location")
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .sort({ createdAt: -1 });
        res.status(200).json({
            message: "Services retrieved successfully",
            services,
        });
    }
    catch (error) {
        console.error("Error fetching services:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching services",
            error: error.message,
        });
    }
});
exports.getAllServices = getAllServices;
// Controller to get all services for a specific location
const getServicesForLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { locationId } = req.params;
        // Fetch services related to the locationId
        const services = yield service_1.default.find({ location: locationId });
        res.status(200).json({
            message: "Services fetched successfully",
            services,
        });
    }
    catch (error) {
        console.error("Error fetching services for location:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
});
exports.getServicesForLocation = getServicesForLocation;
// Get Service by ID Controller
const getServiceById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const serviceId = req.params.id;
    try {
        const service = yield service_1.default.findById(serviceId)
            .populate("location")
            .populate("user", "username")
            .populate("reviews.userId", "username");
        if (!service) {
            res.status(404).json({
                message: "Service not found",
            });
            return;
        }
        res.status(200).json({
            message: "Service retrieved successfully",
            service,
        });
    }
    catch (error) {
        console.error("Error fetching service:", error);
        res.status(500).json({
            message: "Server error while fetching service",
            error: error.message,
        });
    }
});
exports.getServiceById = getServiceById;
const submitReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const serviceId = req.params.id;
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
        const service = yield service_1.default.findById(serviceId);
        if (!service) {
            res.status(404).json({
                success: false,
                message: "Service not found",
            });
            return;
        }
        const newReview = {
            userId: userId,
            content,
            rating,
        };
        (_a = service.reviews) === null || _a === void 0 ? void 0 : _a.push(newReview);
        // Recalculate the average rating
        const totalRatings = service.reviews.reduce((acc, review) => acc + review.rating, 0);
        service.rating = totalRatings / service.reviews.length;
        // Save the updated service
        yield service.save();
        res.status(201).json({
            message: "Review submitted successfully",
            service,
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
const deleteService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const serviceId = req.params.id;
    const userId = req.user._id;
    try {
        // Find the service by ID
        const service = yield service_1.default.findById(serviceId);
        if (!service) {
            res.status(404).json({
                message: "Service not found",
            });
            return;
        }
        // Check if the authenticated user is the owner of the service
        if (service.user.toString() !== userId.toString()) {
            res.status(403).json({
                message: "You are not authorized to delete this service",
            });
            return;
        }
        if (service.images && service.images.length > 0) {
            yield Promise.all(service.images.map((image) => __awaiter(void 0, void 0, void 0, function* () {
                yield (0, media_1.deleteMediaFromSupabase)(image); // Function to delete the file from S3
            })));
        }
        yield service.deleteOne();
        res.status(200).json({
            message: "Service deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting service:", error);
        res.status(500).json({
            message: "Server error while deleting service",
            error: error.message,
        });
    }
});
exports.deleteService = deleteService;
