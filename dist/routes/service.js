"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const service_1 = require("../controllers/service");
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
router.get("/", service_1.getAllServices);
router.get("/:id", service_1.getServiceById);
router.get("/location/:locationId", service_1.getServicesForLocation);
router.post("/", (0, auth_1.auth)(), 
// serviceValidation,
upload.array("media"), service_1.createService);
router.post("/:id/review", (0, auth_1.auth)(), validations_1.serviceReviewValidation, service_1.submitReview);
router.put("/:id", (0, auth_1.auth)(), validations_1.serviceValidation, service_1.updateService);
router.delete("/:id", (0, auth_1.auth)(), service_1.deleteService);
exports.default = router;
