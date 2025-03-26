"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../controllers/auth");
const validations_1 = require("../utils/validations");
const router = express_1.default.Router();
// Register route
router.post("/register", validations_1.registerValidation, auth_1.register);
router.post("/verify", auth_1.verifyEmail);
// Login route
router.post("/login", auth_1.login);
router.post("/send-verification-code", auth_1.sendVerificationCode);
router.post("/forgot-password", auth_1.requestForgotPasswordCode);
router.post("/verify-token", auth_1.verifyForgotPasswordToken);
router.post("/verify-password-code", auth_1.resetForgotPasswordCode);
exports.default = router;
