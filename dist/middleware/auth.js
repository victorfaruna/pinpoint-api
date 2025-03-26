"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Secret key used for signing the JWT
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
// Middleware to authenticate user via JWT and optionally check roles
const auth = (allowedRoles) => {
    return (req, res, next) => {
        // Get the token from the authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res
                .status(401)
                .json({ message: "No token provided, authorization denied" });
            return;
        }
        // Extract the token from the header
        const token = authHeader.split(" ")[1];
        try {
            // Verify the token
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            // Attach user information to the request object
            req.user = decoded;
            // If roles are specified, check if the user's role is allowed
            if (allowedRoles && !allowedRoles.includes(decoded.role)) {
                res
                    .status(403)
                    .json({ message: "Access denied: insufficient permissions" });
                return;
            }
            // Proceed to the next middleware/route handler
            next();
        }
        catch (error) {
            res.status(401).json({ message: "Invalid or expired token" });
        }
    };
};
exports.auth = auth;
