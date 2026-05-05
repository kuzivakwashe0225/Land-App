import jwt from "jsonwebtoken";
import User from "../models/user-model.js";
import { errorHandler } from "./error.js";

export const verifyToken = (req, res, next) => {
  const token = req.cookies?.access_token;

  if (!token) {
    return next(errorHandler(401, "Unauthorized — no token provided. Please sign in."));
  }

  const secret = process.env.JWT_SECRET_KEY;
  if (!secret) {
    console.error("FATAL: JWT_SECRET_KEY is not set in environment variables");
    return next(errorHandler(500, "Server configuration error — please contact support"));
  }

  jwt.verify(token, secret, async (error, decoded) => {
    if (error) {
      if (error.name === "TokenExpiredError") {
        return next(errorHandler(401, "Session expired. Please sign in again."));
      }
      console.log("JWT Verification Error:", error.message);
      return next(errorHandler(403, "Invalid token. Please sign in again."));
    }

    try {
      const user = await User.findById(decoded.id).select("-authentication.password -authentication.twoFactorSecret");
      if (!user) {
        return next(errorHandler(404, "User not found"));
      }

      // Check account status
      if (user.activity?.accountStatus !== "ACTIVE") {
        return next(errorHandler(403, `Account is ${user.activity?.accountStatus?.toLowerCase()}. Contact support.`));
      }

      req.user = user;
      next();
    } catch (dbError) {
      console.error("Database error in verifyToken:", dbError);
      next(dbError);
    }
  });
};
