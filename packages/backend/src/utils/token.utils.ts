import { config } from "../config/app.config";
import { JwtPayload } from "../middleware/auth.middleware";
import { ROLE_PERMISSIONS } from "../middleware/permission.middleware";
import User from "../models/user.model";
import redisClient from "./redisClient.utils";
import jwt from "jsonwebtoken";

export class TokenManager {
  static async generateTokens(
    userId: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      workspaceId: user.workspaces?.[0]?.toString(),
      permissions: ROLE_PERMISSIONS[user.role] || [],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60,
    };

    const accessToken = jwt.sign(payload, config.JWT_SECRET!);

    const refreshPayload = {
      userId: user?._id,
      type: "refresh",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    };

    const refreshToken = jwt.sign(refreshPayload, config.JWT_REFRESH_SECRET!);

    // Store refresh token in Redis
    await redisClient.setex(
      `refresh:${userId}`,
      7 * 24 * 60 * 60,
      refreshToken
    );

    return { accessToken, refreshToken };
  }

  static async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string } | null> {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as any;

      // Check if refresh token exists in Redis
      const storedToken = await redisClient.get(`refresh:${decoded.userId}`);
      if (storedToken !== refreshToken) {
        return null;
      }

      const { accessToken } = await this.generateTokens(decoded.userId);
      return { accessToken };
    } catch (error) {
      return null;
    }
  }

  static async revokeToken(token: string): Promise<void> {
    // Add to blacklist with expiration matching token expiration
    const decoded = jwt.decode(token) as any;
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

    if (expiresIn > 0) {
      await redisClient.setex(`blacklist:${token}`, expiresIn, "revoked");
    }
  }
}
