import express from "express";
import {
  login,
  register,
  requestForgotPasswordCode,
  resetForgotPasswordCode,
  sendVerificationCode,
  verifyEmail,
  verifyForgotPasswordToken,
} from "../controllers/auth";
import { registerValidation } from "../utils/validations";

const router = express.Router();

// Register route
router.post("/register", registerValidation, register);

router.post("/verify", verifyEmail);

// Login route
router.post("/login", login);

router.post("/send-verification-code", sendVerificationCode);

router.post("/forgot-password", requestForgotPasswordCode);
router.post("/verify-token", verifyForgotPasswordToken);

router.post("/verify-password-code", resetForgotPasswordCode);

export default router;
