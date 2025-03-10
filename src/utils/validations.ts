import { body, check } from "express-validator";
import { UserRole } from "../models/user";

export const registerValidation = [
  body("firstName").isString().notEmpty().withMessage("First name is required"),
  body("lastName").isString().notEmpty().withMessage("Last name is required"),
  body("username").isString().notEmpty().withMessage("Username is required"),
  body("email").isEmail().withMessage("Invalid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .isIn([UserRole.CUSTOMER, UserRole.PARTNER, UserRole.ADMIN])
    .withMessage(
      "Role is required and must be one of customer, partner, or admin"
    ),
  body("city").isString().notEmpty().withMessage("City is required"),
  body("state").isString().notEmpty().withMessage("State is required"),
];

export const validateCreateLocation = [
  check("locationName")
    .not()
    .isEmpty()
    .withMessage("Location name is required"),
  check("address").not().isEmpty().withMessage("Address is required"),
  check("description").not().isEmpty().withMessage("Description is required"),
  check("categories")
    .isArray({ min: 1 })
    .withMessage("Categories should be an array with at least one category"),
  check("hoursOfOperation")
    .isArray({ min: 1 })
    .withMessage(
      "Hours of operation should be an array with at least one entry"
    ),
  check("hoursOfOperation.*.day")
    .not()
    .isEmpty()
    .withMessage("Day is required for hours of operation"),
  check("hoursOfOperation.*.open")
    .not()
    .isEmpty()
    .withMessage("Open time is required for hours of operation"),
  check("hoursOfOperation.*.close")
    .not()
    .isEmpty()
    .withMessage("Close time is required for hours of operation"),
  check("coordinates.latitude")
    .isFloat()
    .withMessage("Valid latitude is required"),
  check("coordinates.longitude")
    .isFloat()
    .withMessage("Valid longitude is required"),
  body("menu").custom((value) => {
    if (!Array.isArray(value) || value.length === 0) {
      throw new Error("Menu must be an array with at least one category");
    }
    value.forEach((item) => {
      if (
        !item.category ||
        !Array.isArray(item.items) ||
        item.items.length === 0
      ) {
        throw new Error("Each menu category must have items");
      }
    });
    return true;
  }),
];

export const validateCreatePost = [
  body("content").optional().isString().withMessage("Content must be a string"),
  body("media").optional().isArray().withMessage("Media must be an array"),
  body("media.*.url")
    .if(body("media").exists())
    .isURL()
    .withMessage("Each media item must have a valid URL"),
  body("media.*.type")
    .if(body("media").exists())
    .isIn(["image", "video", "text"])
    .withMessage(
      "Invalid media type. Allowed types are 'image', 'video', 'text'"
    ),
];

export const productValidation = [
  check("name")
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ max: 100 })
    .withMessage("Product name cannot exceed 100 characters"),
  check("description")
    .notEmpty()
    .withMessage("Product description is required")
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  check("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  check("images")
    .isArray({ min: 1 })
    .withMessage("At least one image is required"),
  check("location")
    .isArray({ min: 1 })
    .withMessage("At least one locationmain category is required"),
  check("mainCategory")
    .isArray({ min: 1 })
    .withMessage("At least one main category is required"),
  check("category")
    .isArray({ min: 1 })
    .withMessage("At least one category is required"),
  check("availableOnline")
    .isBoolean()
    .withMessage("Available Online must be a boolean value"),
  check("ships").isBoolean().withMessage("Ships must be a boolean value"),
  check("pickupAvailable")
    .isBoolean()
    .withMessage("Pickup Available must be a boolean value"),
  check("inShopOnly")
    .isBoolean()
    .withMessage("In Shop Only must be a boolean value"),
];

export const productReviewValidation = [
  check("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  check("content")
    .notEmpty()
    .withMessage("Review content is required")
    .isLength({ max: 1000 })
    .withMessage("Review content cannot exceed 1000 characters"),
];

export const serviceValidation = [
  check("name")
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ max: 100 })
    .withMessage("Product name cannot exceed 100 characters"),
  check("description")
    .notEmpty()
    .withMessage("Product description is required")
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  check("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  check("images")
    .isArray({ min: 1 })
    .withMessage("At least one image is required"),
  check("location")
    .isArray({ min: 1 })
    .withMessage("At least one locationmain category is required"),
  check("mainCategory")
    .isArray({ min: 1 })
    .withMessage("At least one main category is required"),
  check("category")
    .isArray({ min: 1 })
    .withMessage("At least one category is required"),
  check("availableOnline")
    .isBoolean()
    .withMessage("Available Online must be a boolean value"),
  check("ships").isBoolean().withMessage("Ships must be a boolean value"),
  check("pickupAvailable")
    .isBoolean()
    .withMessage("Pickup Available must be a boolean value"),
  check("inShopOnly")
    .isBoolean()
    .withMessage("In Shop Only must be a boolean value"),
];

export const serviceReviewValidation = [
  check("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  check("content")
    .notEmpty()
    .withMessage("Review content is required")
    .isLength({ max: 1000 })
    .withMessage("Review content cannot exceed 1000 characters"),
];

export const leadValidation = [
  check("customerName").notEmpty().withMessage("Customer name is required"),
  check("email").isEmail().withMessage("Valid email is required"),
  check("phone").notEmpty().withMessage("Phone number is required"),
  check("contactMethod")
    .isIn(["text", "email", "call"])
    .withMessage("Invalid contact method"),
  check("address").notEmpty().withMessage("Address is required"),
  check("serviceRequestDate").isISO8601().withMessage("Valid date is required"),
  check("details").notEmpty().withMessage("Details are required"),
  check("location").isArray().withMessage("Location is required"),
  check("service").isArray().withMessage("Service is required"),
];
