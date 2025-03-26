"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadValidation = exports.serviceReviewValidation = exports.serviceValidation = exports.productReviewValidation = exports.productValidation = exports.validateCreatePost = exports.validateCreateLocation = exports.registerValidation = void 0;
const express_validator_1 = require("express-validator");
const user_1 = require("../models/user");
exports.registerValidation = [
    (0, express_validator_1.body)("firstName").isString().notEmpty().withMessage("First name is required"),
    (0, express_validator_1.body)("lastName").isString().notEmpty().withMessage("Last name is required"),
    (0, express_validator_1.body)("username").isString().notEmpty().withMessage("Username is required"),
    (0, express_validator_1.body)("email").isEmail().withMessage("Invalid email address"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),
    (0, express_validator_1.body)("role")
        .isIn([user_1.UserRole.CUSTOMER, user_1.UserRole.PARTNER, user_1.UserRole.ADMIN])
        .withMessage("Role is required and must be one of customer, partner, or admin"),
    (0, express_validator_1.body)("city").isString().notEmpty().withMessage("City is required"),
    (0, express_validator_1.body)("state").isString().notEmpty().withMessage("State is required"),
];
exports.validateCreateLocation = [
    (0, express_validator_1.check)("locationName")
        .not()
        .isEmpty()
        .withMessage("Location name is required"),
    (0, express_validator_1.check)("address").not().isEmpty().withMessage("Address is required"),
    (0, express_validator_1.check)("description").not().isEmpty().withMessage("Description is required"),
    (0, express_validator_1.check)("categories")
        .isArray({ min: 1 })
        .withMessage("Categories should be an array with at least one category"),
    (0, express_validator_1.check)("hoursOfOperation")
        .isArray({ min: 1 })
        .withMessage("Hours of operation should be an array with at least one entry"),
    (0, express_validator_1.check)("hoursOfOperation.*.day")
        .not()
        .isEmpty()
        .withMessage("Day is required for hours of operation"),
    (0, express_validator_1.check)("hoursOfOperation.*.open")
        .not()
        .isEmpty()
        .withMessage("Open time is required for hours of operation"),
    (0, express_validator_1.check)("hoursOfOperation.*.close")
        .not()
        .isEmpty()
        .withMessage("Close time is required for hours of operation"),
    (0, express_validator_1.check)("coordinates.latitude")
        .isFloat()
        .withMessage("Valid latitude is required"),
    (0, express_validator_1.check)("coordinates.longitude")
        .isFloat()
        .withMessage("Valid longitude is required"),
    (0, express_validator_1.body)("menu").custom((value) => {
        if (!Array.isArray(value) || value.length === 0) {
            throw new Error("Menu must be an array with at least one category");
        }
        value.forEach((item) => {
            if (!item.category ||
                !Array.isArray(item.items) ||
                item.items.length === 0) {
                throw new Error("Each menu category must have items");
            }
        });
        return true;
    }),
];
exports.validateCreatePost = [
    (0, express_validator_1.body)("content").optional().isString().withMessage("Content must be a string"),
    (0, express_validator_1.body)("media").optional().isArray().withMessage("Media must be an array"),
    (0, express_validator_1.body)("media.*.url")
        .if((0, express_validator_1.body)("media").exists())
        .isURL()
        .withMessage("Each media item must have a valid URL"),
    (0, express_validator_1.body)("media.*.type")
        .if((0, express_validator_1.body)("media").exists())
        .isIn(["image", "video", "text"])
        .withMessage("Invalid media type. Allowed types are 'image', 'video', 'text'"),
];
exports.productValidation = [
    (0, express_validator_1.check)("name")
        .notEmpty()
        .withMessage("Product name is required")
        .isLength({ max: 100 })
        .withMessage("Product name cannot exceed 100 characters"),
    (0, express_validator_1.check)("description")
        .notEmpty()
        .withMessage("Product description is required")
        .isLength({ max: 500 })
        .withMessage("Description cannot exceed 500 characters"),
    (0, express_validator_1.check)("price")
        .isFloat({ min: 0 })
        .withMessage("Price must be a positive number"),
    (0, express_validator_1.check)("images")
        .isArray({ min: 1 })
        .withMessage("At least one image is required"),
    (0, express_validator_1.check)("location")
        .isArray({ min: 1 })
        .withMessage("At least one locationmain category is required"),
    (0, express_validator_1.check)("mainCategory")
        .isArray({ min: 1 })
        .withMessage("At least one main category is required"),
    (0, express_validator_1.check)("category")
        .isArray({ min: 1 })
        .withMessage("At least one category is required"),
    (0, express_validator_1.check)("availableOnline")
        .isBoolean()
        .withMessage("Available Online must be a boolean value"),
    (0, express_validator_1.check)("ships").isBoolean().withMessage("Ships must be a boolean value"),
    (0, express_validator_1.check)("pickupAvailable")
        .isBoolean()
        .withMessage("Pickup Available must be a boolean value"),
    (0, express_validator_1.check)("inShopOnly")
        .isBoolean()
        .withMessage("In Shop Only must be a boolean value"),
];
exports.productReviewValidation = [
    (0, express_validator_1.check)("rating")
        .isInt({ min: 1, max: 5 })
        .withMessage("Rating must be between 1 and 5"),
    (0, express_validator_1.check)("content")
        .notEmpty()
        .withMessage("Review content is required")
        .isLength({ max: 1000 })
        .withMessage("Review content cannot exceed 1000 characters"),
];
exports.serviceValidation = [
    (0, express_validator_1.check)("name")
        .notEmpty()
        .withMessage("Product name is required")
        .isLength({ max: 100 })
        .withMessage("Product name cannot exceed 100 characters"),
    (0, express_validator_1.check)("description")
        .notEmpty()
        .withMessage("Product description is required")
        .isLength({ max: 500 })
        .withMessage("Description cannot exceed 500 characters"),
    (0, express_validator_1.check)("price")
        .isFloat({ min: 0 })
        .withMessage("Price must be a positive number"),
    (0, express_validator_1.check)("images")
        .isArray({ min: 1 })
        .withMessage("At least one image is required"),
    (0, express_validator_1.check)("location")
        .isArray({ min: 1 })
        .withMessage("At least one locationmain category is required"),
    (0, express_validator_1.check)("mainCategory")
        .isArray({ min: 1 })
        .withMessage("At least one main category is required"),
    (0, express_validator_1.check)("category")
        .isArray({ min: 1 })
        .withMessage("At least one category is required"),
    (0, express_validator_1.check)("availableOnline")
        .isBoolean()
        .withMessage("Available Online must be a boolean value"),
    (0, express_validator_1.check)("ships").isBoolean().withMessage("Ships must be a boolean value"),
    (0, express_validator_1.check)("pickupAvailable")
        .isBoolean()
        .withMessage("Pickup Available must be a boolean value"),
    (0, express_validator_1.check)("inShopOnly")
        .isBoolean()
        .withMessage("In Shop Only must be a boolean value"),
];
exports.serviceReviewValidation = [
    (0, express_validator_1.check)("rating")
        .isInt({ min: 1, max: 5 })
        .withMessage("Rating must be between 1 and 5"),
    (0, express_validator_1.check)("content")
        .notEmpty()
        .withMessage("Review content is required")
        .isLength({ max: 1000 })
        .withMessage("Review content cannot exceed 1000 characters"),
];
exports.leadValidation = [
    (0, express_validator_1.check)("customerName").notEmpty().withMessage("Customer name is required"),
    (0, express_validator_1.check)("email").isEmail().withMessage("Valid email is required"),
    (0, express_validator_1.check)("phone").notEmpty().withMessage("Phone number is required"),
    (0, express_validator_1.check)("contactMethod")
        .isIn(["text", "email", "call"])
        .withMessage("Invalid contact method"),
    (0, express_validator_1.check)("address").notEmpty().withMessage("Address is required"),
    (0, express_validator_1.check)("serviceRequestDate").isISO8601().withMessage("Valid date is required"),
    (0, express_validator_1.check)("details").notEmpty().withMessage("Details are required"),
    (0, express_validator_1.check)("location").isArray().withMessage("Location is required"),
    (0, express_validator_1.check)("service").isArray().withMessage("Service is required"),
];
