"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_1 = require("../controllers/product");
const validations_1 = require("../utils/validations");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const storage = multer_1.default.memoryStorage();
// Multer config
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 5MB
});
router.get("/", product_1.getAllProducts);
router.get("/:id", product_1.getProductById);
router.get("/location/:locationId", product_1.getProductsForLocation);
router.post("/", (0, auth_1.auth)(), 
// productValidation,
upload.array("media"), product_1.createProduct);
router.post("/:id/review", (0, auth_1.auth)(), validations_1.productReviewValidation, product_1.submitReview);
router.put("/:id", (0, auth_1.auth)(), validations_1.productValidation, product_1.updateProduct);
router.delete("/:id", (0, auth_1.auth)(), product_1.deleteProduct);
exports.default = router;
