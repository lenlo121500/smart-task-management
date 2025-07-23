import { config } from "../config/app.config";
import { APIError } from "../utils/APIError.utils";
import { NextFunction, Response, Request } from "express";
import redisClient from "../utils/redisClient.utils";
import jwt from "jsonwebtoken";
import User from "../models/user.model";

interface JwtPayload {
  userId: string;
  email: string;
  role: "admin" | "manager" | "member";
  workspaceId?: string;
  permissions: string[];
  iat: number;
  exp: number;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      throw new APIError("No token provided", 401);
    }

    // check redis blacklist for revoked tokens
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new APIError("Token has been revoked", 401);
    }

    const decoded = jwt.verify(token, config.JWT_SECRET!) as JwtPayload;

    // get fresh user data for critical operations
    const user = await User.findById(decoded.userId).select("-passwordHash");
    if (!user || !user.isActive) {
      throw new APIError("User not found or inactive", 404);
    }

    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    return next(new APIError("Invalid token", 401));
  }
};
