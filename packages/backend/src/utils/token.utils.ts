import { config } from "../config/app.config";
import { JwtPayload } from "../middleware/auth.middleware";
import { ROLE_PERMISSIONS } from "../middleware/permission.middleware";
import User from "../models/user.model";
import logger from "./logger.utils";
import redisClient from "./redisClient.utils";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

export class TokenManager {
  static async generateTokens(
    userId: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const accessJti = uuidv4();
    const refreshJti = uuidv4();

    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      workspaceId: user.workspaces?.[0]?.toString(),
      permissions: ROLE_PERMISSIONS[user.role] || [],
      jti: accessJti,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60,
    };

    const accessToken = jwt.sign(payload, config.JWT_SECRET!);

    const refreshPayload = {
      userId: user?._id,
      type: "refresh",
      jti: refreshJti,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    };

    const refreshToken = jwt.sign(refreshPayload, config.JWT_REFRESH_SECRET!);

    // Store refresh token in Redis
    await redisClient.setex(
      `refresh:${refreshJti}`,
      7 * 24 * 60 * 60,
      refreshToken
    );

    return { accessToken, refreshToken };
  }

  static async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        config.JWT_REFRESH_SECRET!
      ) as any;

      // Check if refresh token exists in Redis
      const storedToken = await redisClient.get(`refresh:${decoded.userId}`);
      if (!storedToken || storedToken !== refreshToken) {
        return null;
      }

      await redisClient.del(`refresh:${decoded.jti}`);

      const { accessToken } = await this.generateTokens(decoded.userId);
      return { accessToken };
    } catch (error) {
      return null;
    }
  }

  static async revokeToken(token: string): Promise<void> {
    // Add to blacklist with expiration matching token expiration
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET!) as any;
      const jti = decoded?.jti;
      const exp = decoded?.exp;

      if (!exp) return;

      const expiresIn = exp - Math.floor(Date.now() / 1000);

      if (jti && decoded?.type === "refresh") {
        await redisClient.del(`refresh:${jti}`);
      }

      await redisClient.setex(`blacklist:${token}`, expiresIn, "revoked");
    } catch (err) {
      logger.warn("Tried to revoke invalid token.");
    }
  }

  static async isTokenRevoked(token: string) {
    const isRevoked = await redisClient.get(`blacklist:${token}`);
    return !!isRevoked;
  }
}
