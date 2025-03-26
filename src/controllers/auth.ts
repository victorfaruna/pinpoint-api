import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { UserRole } from "../models/user";
import { body, validationResult } from "express-validator";
import { Request, Response } from "express";
import { sendEmail } from "../utils/auth";
import { users } from "../db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

// Register a new user
export const register = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const filteredBody = Object.keys(req.body).reduce((acc, key) => {
      if (
        req.body[key] !== null &&
        req.body[key] !== undefined &&
        req.body[key] !== ""
      ) {
        acc[key] = req.body[key];
      }
      return acc;
    }, {} as Record<string, any>);

    const {
      firstName,
      lastName,
      username,
      email: userEmail,
      password,
      role,
      city,
      state,
      ...otherFields
    } = filteredBody;
    console.log(req.body);

    const email = userEmail.trim().toLowerCase();

    const existingUserByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (existingUserByEmail && existingUserByEmail.length > 0) {
      res.status(400).json({ message: "Email is already in use" });
      return;
    }

    // Check if username is already in use
    const existingUserByUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    if (existingUserByUsername && existingUserByUsername.length > 0) {
      res.status(400).json({ message: "Username is already in use" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.insert(users).values({
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
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// Verification controller
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, code: verificationCode } = req.body;

    if (!email || !verificationCode) {
      res
        .status(400)
        .json({ message: "Email and verification code are required." });

      return;
    }

    // Find the user by email
    const user = await User.findOne({ email });
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
    if (
      user.verificationCodeExpires &&
      new Date() > user.verificationCodeExpires
    ) {
      res.status(400).json({ message: "Verification code has expired." });
      return;
    }

    // Update the user to mark them as verified
    user.isVerified = true; // Assuming you have an `isVerified` field in the User model
    user.verificationCode = undefined; // Clear the verification code after successful verification
    user.verificationCodeExpires = undefined; // Clear the expiration time
    await user.save();

    res.status(200).json({ message: "Email verified successfully." });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    return;
  }
};

// Login a user
export const login = async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  try {
    const user = await db.select().from(users).where(eq(users.email, email));

    if (!user || user.length === 0) {
      res.status(404).json({ message: "Invalid credentials" });
      return;
    }

    console.log(user);

    const isMatch = await bcrypt.compare(password, user[0].password);
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

    const token = jwt.sign(
      { _id: user[0].id, role: user[0].role },
      process.env.JWT_SECRET!,
      { expiresIn: "30d" }
    );

    res.status(200).json({
      token,
    });
  } catch (error) {
    console.log("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Send Verification Code
export const sendVerificationCode = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    // const user = await User.findOne({ email, delected: false });

    const user = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Generate a 6-digit verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Set expiration time (e.g., 15 minutes from now)
    const verificationCodeExpire = Date.now() + 15 * 60 * 1000;

    // Update user with verification code and expiration

    // user.verificationCode = verificationCode;
    // user.verificationCodeExpires = new Date(verificationCodeExpire);

    user[0].verificationCode = verificationCode;
    user[0].verificationCodeExpires = new Date(verificationCodeExpire);

    await db.update(users).set(user[0]).where(eq(users.id, user[0].id));

    // Send the verification code via email
    await sendEmail({
      to: user[0].email,
      subject: "Your Verification Code",
      text: `Your verification code is ${verificationCode}. This code will expire in 15 minutes.`,
    });

    res.status(200).json({ message: "Verification code sent to your email" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error", error });
  }
};

// Request Forgot Password Code
export const requestForgotPasswordCode = async (
  req: Request,
  res: Response
) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Generate a 6-digit verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Set expiration time (e.g., 15 minutes from now)
    const verificationCodeExpire = Date.now() + 15 * 60 * 1000;

    // Update user with verification code and expiration
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = new Date(verificationCodeExpire);
    await user.save();

    // Send the verification code via email
    await sendEmail({
      to: user.email,
      subject: "Your Password Reset Code",
      text: `Your password reset code is ${verificationCode}. This code will expire in 15 minutes.`,
    });

    res.status(200).json({ message: "Password reset code sent to your email" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error", error });
  }
};

export const verifyForgotPasswordToken = async (
  req: Request,
  res: Response
) => {
  const { email, code } = req.body;

  try {
    // Find the user with the matching email and non-deleted status
    const user = await User.findOne({ email, delected: false });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Check if the code matches and has not expired
    if (
      user.verificationCode !== code ||
      !user.verificationCodeExpires ||
      user.verificationCodeExpires < new Date()
    ) {
      res.status(400).json({ message: "Invalid or expired code" });
      return;
    }

    // Code is valid; respond with success
    res.status(200).json({ message: "Code verified successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error", error });
  }
};

// Verify Code and Reset Password
export const resetForgotPasswordCode = async (req: Request, res: Response) => {
  const { email, verificationCode, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Check if the verification code is correct and not expired

    // Check if the verification code is expired
    if (
      user.verificationCodeExpires &&
      new Date() > user.verificationCodeExpires
    ) {
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
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password and clear the verification code fields
    user.password = hashedPassword;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};
