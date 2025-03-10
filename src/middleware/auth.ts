import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

// Secret key used for signing the JWT
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

export interface CustomRequest extends Request {
  user?: {
    _id: string;
    email: string;
    role: string;
  };
}

// Middleware to authenticate user via JWT and optionally check roles
export const auth = (allowedRoles?: string[]) => {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
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
      const decoded = jwt.verify(token, JWT_SECRET) as {
        _id: string;
        email: string;
        role: string;
      };
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
    } catch (error) {
      res.status(401).json({ message: "Invalid or expired token" });
    }
  };
};
