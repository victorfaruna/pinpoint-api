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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetForgotPasswordCode = exports.verifyForgotPasswordToken = exports.requestForgotPasswordCode = exports.sendVerificationCode = exports.login = exports.verifyEmail = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_1 = __importDefault(require("../models/user"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../utils/auth");
const schema_1 = require("../db/schema");
const db_1 = require("../db");
const drizzle_orm_1 = require("drizzle-orm");
// Register a new user
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const filteredBody = Object.keys(req.body).reduce((acc, key) => {
            if (req.body[key] !== null &&
                req.body[key] !== undefined &&
                req.body[key] !== "") {
                acc[key] = req.body[key];
            }
            return acc;
        }, {});
        const { firstName, lastName, username, email: userEmail, password, role, city, state } = filteredBody, otherFields = __rest(filteredBody, ["firstName", "lastName", "username", "email", "password", "role", "city", "state"]);
        console.log(req.body);
        const email = userEmail.trim().toLowerCase();
        const existingUserByEmail = yield db_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        if (existingUserByEmail && existingUserByEmail.length > 0) {
            res.status(400).json({ message: "Email is already in use" });
            return;
        }
        // Check if username is already in use
        const existingUserByUsername = yield db_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.username, username));
        if (existingUserByUsername && existingUserByUsername.length > 0) {
            res.status(400).json({ message: "Username is already in use" });
            return;
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = yield db_1.db.insert(schema_1.users).values({
            firstName,
            lastName,
            username,
            email,
            password: hashedPassword,
            role,
            city,
            state,
        });
        // await sendVerificationEmail(email, verificationCode);
        if (!user) {
            console.log("Error registering user");
            res.status(500).json({ message: "Internal Server Error" });
            return;
        }
        res.status(201).json({ message: "User registered successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
});
exports.register = register;
// Verification controller
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, code: verificationCode } = req.body;
        if (!email || !verificationCode) {
            res
                .status(400)
                .json({ message: "Email and verification code are required." });
            return;
        }
        // Find the user by email
        const user = yield user_1.default.findOne({ email });
        if (!user) {
            res.status(404).json({ message: "User not found." });
            return;
        }
        // Validate the verification code
        if (user.verificationCode !== verificationCode) {
            res.status(400).json({ message: "Invalid verification code." });
            return;
        }
        // // Check if the verification code is expired
        if (user.verificationCodeExpires &&
            new Date() > user.verificationCodeExpires) {
            res.status(400).json({ message: "Verification code has expired." });
            return;
        }
        // Update the user to mark them as verified
        user.isVerified = true; // Assuming you have an `isVerified` field in the User model
        user.verificationCode = undefined; // Clear the verification code after successful verification
        user.verificationCodeExpires = undefined; // Clear the expiration time
        yield user.save();
        res.status(200).json({ message: "Email verified successfully." });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        return;
    }
});
exports.verifyEmail = verifyEmail;
// Login a user
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, role } = req.body;
    try {
        const user = yield db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        if (!user || user.length === 0) {
            res.status(404).json({ message: "Invalid credentials" });
            return;
        }
        console.log(user);
        const isMatch = yield bcryptjs_1.default.compare(password, user[0].password);
        if (!isMatch) {
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }
        console.log(role, user[0].role);
        if (role !== user[0].role) {
            res
                .status(400)
                .json({ message: `Pls login at the ${user[0].role} side` });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ _id: user[0].id, role: user[0].role }, process.env.JWT_SECRET, { expiresIn: "30d" });
        res.status(200).json({
            token,
        });
    }
    catch (error) {
        console.log("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.login = login;
// Send Verification Code
const sendVerificationCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    try {
        // const user = await User.findOne({ email, delected: false });
        const user = yield db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        // Generate a 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        // Set expiration time (e.g., 15 minutes from now)
        const verificationCodeExpire = Date.now() + 15 * 60 * 1000;
        // Update user with verification code and expiration
        // user.verificationCode = verificationCode;
        // user.verificationCodeExpires = new Date(verificationCodeExpire);
        user[0].verificationCode = verificationCode;
        user[0].verificationCodeExpires = new Date(verificationCodeExpire);
        yield db_1.db.update(schema_1.users).set(user[0]).where((0, drizzle_orm_1.eq)(schema_1.users.id, user[0].id));
        // Send the verification code via email
        yield (0, auth_1.sendEmail)({
            to: user[0].email,
            subject: "Your Verification Code",
            text: `Your verification code is ${verificationCode}. This code will expire in 15 minutes.`,
        });
        res.status(200).json({ message: "Verification code sent to your email" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error", error });
    }
});
exports.sendVerificationCode = sendVerificationCode;
// Request Forgot Password Code
const requestForgotPasswordCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    try {
        const user = yield user_1.default.findOne({ email });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        // Generate a 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        // Set expiration time (e.g., 15 minutes from now)
        const verificationCodeExpire = Date.now() + 15 * 60 * 1000;
        // Update user with verification code and expiration
        user.verificationCode = verificationCode;
        user.verificationCodeExpires = new Date(verificationCodeExpire);
        yield user.save();
        // Send the verification code via email
        yield (0, auth_1.sendEmail)({
            to: user.email,
            subject: "Your Password Reset Code",
            text: `Your password reset code is ${verificationCode}. This code will expire in 15 minutes.`,
        });
        res.status(200).json({ message: "Password reset code sent to your email" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error", error });
    }
});
exports.requestForgotPasswordCode = requestForgotPasswordCode;
const verifyForgotPasswordToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, code } = req.body;
    try {
        // Find the user with the matching email and non-deleted status
        const user = yield user_1.default.findOne({ email, delected: false });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        // Check if the code matches and has not expired
        if (user.verificationCode !== code ||
            !user.verificationCodeExpires ||
            user.verificationCodeExpires < new Date()) {
            res.status(400).json({ message: "Invalid or expired code" });
            return;
        }
        // Code is valid; respond with success
        res.status(200).json({ message: "Code verified successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error", error });
    }
});
exports.verifyForgotPasswordToken = verifyForgotPasswordToken;
// Verify Code and Reset Password
const resetForgotPasswordCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, verificationCode, newPassword } = req.body;
    try {
        const user = yield user_1.default.findOne({ email });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        // Check if the verification code is correct and not expired
        // Check if the verification code is expired
        if (user.verificationCodeExpires &&
            new Date() > user.verificationCodeExpires) {
            res.status(400).json({ message: "Verification code has expired." });
            return;
        }
        console.log(verificationCode, user.verificationCode);
        // Validate the verification code
        if (user.verificationCode !== verificationCode) {
            res.status(400).json({ message: "Invalid verification code." });
            return;
        }
        // Hash the new password
        const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
        // Update the user's password and clear the verification code fields
        user.password = hashedPassword;
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        yield user.save();
        res.status(200).json({ message: "Password reset successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});
exports.resetForgotPasswordCode = resetForgotPasswordCode;
