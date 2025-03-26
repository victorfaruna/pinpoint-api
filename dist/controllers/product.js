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
exports.deleteProduct = exports.submitReview = exports.getProductById = exports.getProductsForLocation = exports.getAllProducts = exports.updateProduct = exports.createProduct = void 0;
const express_validator_1 = require("express-validator");
const product_1 = __importDefault(require("../models/product"));
const media_1 = require("../utils/media");
// Create Product Controller
const createProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        // return;
    }
    try {
        const imageUploadPromises = [];
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                const mediaType = file.mimetype.startsWith("image") ? "image" : "video";
                imageUploadPromises.push((0, media_1.uploadMediaToSupabase)(file.buffer, file.filename, mediaType));
            }
        }
        const imageUploadResults = yield Promise.all(imageUploadPromises);
        console.log(imageUploadResults);
        const { name, description, price, location, mainCategory, category, subCategory, options, availableOnline, productUrl, ships, pickupAvailable, inShopOnly, } = req.body;
        // Create a new Product instance
        const newProduct = new product_1.default({
            user: userId,
            name,
            description,
            price,
            images: imageUploadResults.map((image) => image.url),
            location,
            mainCategory,
            category,
            subCategory,
            options,
            availableOnline,
            productUrl,
            ships,
            pickupAvailable,
            inShopOnly,
        });
        // Save the product to the database
        const savedProduct = yield newProduct.save();
        // Respond with the saved product
        res.status(201).json({
            message: "Product created successfully",
            product: savedProduct,
        });
    }
    catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({
            message: "Server error while creating product",
            error: error.message,
        });
    }
});
exports.createProduct = createProduct;
// Update Product Controller
const updateProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const productId = req.params.id;
    const { name, description, price, location, mainCategory, category, existingImages, subCategory, options, availableOnline, productUrl, ships, pickupAvailable, inShopOnly, } = req.body;
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
        // Find the product by ID
        const product = yield product_1.default.findById(productId);
        if (!product) {
            res.status(404).json({
                message: "Product not found",
            });
            return;
        }
        // Check if the user is the owner of the product
        if (product.user.toString() !== userId) {
            res.status(403).json({
                message: "You are not authorized to update this product",
            });
            return;
        }
        // Handle media update
        const currentImage = product.images || [];
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
        // Update product fields
        product.name = name || product.name;
        product.description = description || product.description;
        product.price = price || product.price;
        if (uploadedImages.length > 0) {
            product.images = [...newImageUrls, ...uploadedImages];
        }
        else {
            product.images = newImageUrls;
        }
        product.location = location || product.location;
        product.mainCategory = mainCategory || product.mainCategory;
        product.category = category || product.category;
        product.subCategory = subCategory || product.subCategory;
        product.options = options || product.options;
        product.availableOnline =
            availableOnline !== undefined ? availableOnline : product.availableOnline;
        product.productUrl = productUrl || product.productUrl;
        product.ships = ships !== undefined ? ships : product.ships;
        product.pickupAvailable =
            pickupAvailable !== undefined ? pickupAvailable : product.pickupAvailable;
        product.inShopOnly =
            inShopOnly !== undefined ? inShopOnly : product.inShopOnly;
        // Save the updated product
        const updatedProduct = yield product.save();
        // Respond with the updated product
        res.status(200).json({
            message: "Product updated successfully",
            product: updatedProduct,
        });
    }
    catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({
            message: "Server error while updating product",
            error: error.message,
        });
    }
});
exports.updateProduct = updateProduct;
const getAllProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, search = "", category = [], subCategory = [], minPrice, maxPrice, inShopOnly, availableOnline, options, } = req.query;
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
        if (inShopOnly)
            query.inShopOnly = inShopOnly === "true";
        if (availableOnline)
            query.availableOnline = availableOnline === "true";
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
        // Get total number of products that match the query
        const totalProducts = yield product_1.default.countDocuments(query);
        // Fetch paginated results with filtering, sorting, and population
        const products = yield product_1.default.find(query)
            .populate("location")
            .populate("user", "username")
            .skip((pageNumber - 1) * pageSize) // Skip for pagination
            .limit(pageSize) // Limit for pagination
            .sort({ createdAt: -1 }); // Sort by most recent products
        res.status(200).json({
            message: "Products retrieved successfully",
            products,
            pagination: {
                totalProducts,
                currentPage: pageNumber,
                totalPages: Math.ceil(totalProducts / pageSize),
                pageSize,
            },
        });
    }
    catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({
            message: "Server error while fetching products",
            error: error.message,
        });
    }
});
exports.getAllProducts = getAllProducts;
// Controller to get all products for a specific location
const getProductsForLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { locationId } = req.params;
        // Fetch products related to the locationId
        const products = yield product_1.default.find({ location: locationId });
        res.status(200).json({
            message: "Products fetched successfully",
            products,
        });
    }
    catch (error) {
        console.error("Error fetching products for location:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
});
exports.getProductsForLocation = getProductsForLocation;
// Get Product by ID Controller
const getProductById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const productId = req.params.id;
    try {
        const product = yield product_1.default.findById(productId)
            .populate("location")
            .populate("user", "username");
        if (!product) {
            res.status(404).json({
                message: "Product not found",
            });
            return;
        }
        res.status(200).json({
            message: "Product retrieved successfully",
            product,
        });
    }
    catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({
            message: "Server error while fetching product",
            error: error.message,
        });
    }
});
exports.getProductById = getProductById;
const submitReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const productId = req.params.id;
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
        const product = yield product_1.default.findById(productId);
        if (!product) {
            res.status(404).json({
                success: false,
                message: "Product not found",
            });
            return;
        }
        const newReview = {
            userId: userId,
            content,
            rating,
        };
        (_a = product.reviews) === null || _a === void 0 ? void 0 : _a.push(newReview);
        // Recalculate the average rating
        const totalRatings = product.reviews.reduce((acc, review) => acc + review.rating, 0);
        product.rating = totalRatings / product.reviews.length;
        // Save the updated product
        yield product.save();
        res.status(201).json({
            message: "Review submitted successfully",
            product,
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
const deleteProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const productId = req.params.id;
    const userId = req.user._id;
    try {
        // Find the product by ID
        const product = yield product_1.default.findById(productId);
        if (!product) {
            res.status(404).json({
                message: "Product not found",
            });
            return;
        }
        // Check if the authenticated user is the owner of the product
        if (product.user.toString() !== userId.toString()) {
            res.status(403).json({
                message: "You are not authorized to delete this product",
            });
            return;
        }
        // Check if the authenticated user is the owner of the product
        if (product.user.toString() !== userId.toString()) {
            res.status(403).json({
                message: "You are not authorized to delete this product",
            });
            return;
        }
        if (product.images && product.images.length > 0) {
            yield Promise.all(product.images.map((image) => __awaiter(void 0, void 0, void 0, function* () {
                yield (0, media_1.deleteMediaFromSupabase)(image); // Function to delete the file from S3
            })));
        }
        yield product.deleteOne();
        res.status(200).json({
            message: "Product deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({
            message: "Server error while deleting product",
            error: error.message,
        });
    }
});
exports.deleteProduct = deleteProduct;
