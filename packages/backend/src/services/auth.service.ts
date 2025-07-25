import { TokenManager } from "./../utils/token.utils";
import mongoose from "mongoose";
import User from "../models/user.model";
import { APIError } from "../utils/APIError.utils";
import Workspace from "../models/workspace.model";
import logger from "../utils/logger.utils";
import { UserDocuments } from "../types/user.types";
import redisClient from "../utils/redisClient.utils";
import emailService from "../utils/email.utils";
import crypto from "crypto";
import { config } from "../config/app.config";

interface RegisterUserBody {
  username: string;
  email: string;
  passwordHash: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar: string;
    timezone: string;
  };
  role?: "admin" | "manager" | "member";
  preferences?: {
    notifications: boolean;
    theme: string;
  };
}

interface EmailVerificationOptions {
  sendWelcomeEmail?: boolean;
  sendOTPVerification?: boolean;
  otpExpirationMinutes?: number;
}

// Generate OTP for email verification
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate secure reset token
const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const registerUserService = async (
  body: RegisterUserBody,
  emailOptions: EmailVerificationOptions = { sendWelcomeEmail: true }
) => {
  const { username, email, passwordHash } = body;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      throw new APIError("User already exists", 400);
    }

    const user = new User({
      username,
      email,
      passwordHash,
      profile: body.profile,
      role: body.role || "member",
      workspaces: [],
      preferences: body.preferences || { notifications: true, theme: "light" },
      lastActive: new Date(),
      // Add email verification status if OTP is enabled
      ...(emailOptions.sendOTPVerification && { emailVerified: false }),
    });

    await user.save({ session });

    const workspace = new Workspace({
      name: `${username}'s Workspace`,
      description: `Workspace created for ${username}`,
      owner: user._id,
    });

    await workspace.save({ session });

    // Update user with workspace
    user.workspaces.push(workspace._id);
    await user.save({ session });

    await session.commitTransaction();
    logger.info(`User registered successfully: ${email}`);

    // Send emails after successful registration
    const emailPromises: Promise<void>[] = [];

    if (emailOptions.sendWelcomeEmail) {
      const welcomeEmailPromise = emailService
        .sendWelcomeEmail(email, {
          firstName: body.profile.firstName,
          username: username,
          workspaceName: workspace.name,
          additionalFeatures:
            body.role === "admin"
              ? [
                  "Admin dashboard access",
                  "User management tools",
                  "Advanced analytics",
                ]
              : undefined,
        })
        .catch((error) => {
          logger.error(`Failed to send welcome email to ${email}:`, error);
        });
      emailPromises.push(welcomeEmailPromise);
    }

    if (emailOptions.sendOTPVerification) {
      const otp = generateOTP();
      const otpExpiration = emailOptions.otpExpirationMinutes || 10;

      const otpKey = `emailVerification:${user._id}`;
      await redisClient.setex(otpKey, otpExpiration * 60, otp);

      const otpEmailPromise = emailService
        .sendOTPEmail(email, otp, body.profile.firstName, {
          expirationMinutes: otpExpiration,
          verificationUrl: `${config.APP_URL}/verify-email?userId=${user._id}`,
        })
        .catch((error) => {
          logger.error(`Failed to send OTP email to ${email}:`, error);
        });
      emailPromises.push(otpEmailPromise);
    }
    await Promise.allSettled(emailPromises);

    return {
      user: user._id,
      workspaceId: workspace._id,
      emailVerificationRequired: emailOptions.sendOTPVerification || false,
    };
  } catch (error) {
    await session.abortTransaction();
    logger.error("Registration failed, session aborted:", error);
    throw error;
  } finally {
    session.endSession();
    logger.info("Registration session ended.");
  }
};

export const verifyEmailService = async (userId: string, otp: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new APIError("User not found", 404);
  }

  if (user.emailVerified) {
    throw new APIError("Email already verified", 400);
  }

  // Check OTP from Redis
  const otpKey = `emailVerification:${userId}`;
  const storedOTP = await redisClient.get(otpKey);

  if (!storedOTP) {
    throw new APIError("OTP expired or invalid", 400);
  }

  if (storedOTP !== otp) {
    throw new APIError("Invalid OTP", 400);
  }

  // Mark email as verified
  user.emailVerified = true;
  await user.save();

  // Clean up OTP from Redis
  await redisClient.del(otpKey);

  logger.info(`Email verified successfully for user: ${user.email}`);

  return {
    message: "Email verified successfully",
    user: user.omitPassword(),
  };
};

export const resendVerificationOTPService = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new APIError("User not found", 404);
  }

  if (user.emailVerified) {
    throw new APIError("Email already verified", 400);
  }

  // Generate new OTP
  const otp = generateOTP();
  const otpExpiration = 10;

  // Store new OTP in Redis
  const otpKey = `emailVerification:${userId}`;
  await redisClient.setex(otpKey, otpExpiration * 60, otp);

  try {
    await emailService.sendOTPEmail(user.email, otp, user.profile.firstName, {
      expirationMinutes: otpExpiration,
      verificationUrl: `${process.env.APP_URL}/verify-email?userId=${userId}`,
    });

    logger.info(`Verification OTP resent to: ${user.email}`);
    return { message: "Verification code sent successfully" };
  } catch (error) {
    logger.error(`Failed to resend OTP to ${user.email}:`, error);
    throw new APIError("Failed to send verification email", 500);
  }
};

export const loginUserService = async (email: string, password: string) => {
  const user = (await User.findOne({ email }).select(
    "+passwordHash"
  )) as UserDocuments;

  if (!user) {
    throw new APIError("User not found", 404);
  }

  // Check if email verification is required and not completed
  if (user.emailVerified === false) {
    throw new APIError(
      "Please verify your email address before logging in",
      403
    );
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    logger.warn(`Failed login attempt for email: ${email}`);
    throw new APIError("Invalid password", 401);
  }

  const token = await TokenManager.generateTokens(user._id.toString());
  if (!token) {
    throw new APIError("Failed to generate tokens", 500);
  }

  user.lastActive = new Date();
  await user.save();

  logger.info(`User logged in successfully: ${email}`);

  return {
    user: user.omitPassword(),
    accessToken: token.accessToken,
    refreshToken: token.refreshToken,
  };
};

export const logoutUserService = async (token: string) => {
  await TokenManager.revokeToken(token);
  logger.info("User logged out successfully");
};

export const refreshTokenService = async (refreshToken: string) => {
  const token = await TokenManager.refreshToken(refreshToken);
  if (!token) {
    throw new APIError("Invalid refresh token", 401);
  }

  return token;
};

export const forgotPasswordService = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    logger.warn(`Password reset requested for non-existent email: ${email}`);
    return {
      message:
        "If an account with that email exists, a password reset link has been sent.",
    };
  }

  // Generate secure reset token
  const resetToken = generateResetToken();
  const resetExpiration = 3600;

  // Store reset token in Redis
  const resetKey = `resetPassword:${resetToken}`;
  await redisClient.setex(resetKey, resetExpiration, user._id.toString());

  // Create reset URL
  const resetUrl = `${config.APP_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;

  try {
    await emailService.sendForgotPasswordEmail(email, {
      firstName: user.profile.firstName,
      resetToken,
      resetUrl,
      expirationTime: "1 hour",
    });

    logger.info(`Password reset email sent to: ${email}`);
    return {
      message:
        "If an account with that email exists, a password reset link has been sent.",
    };
  } catch (error) {
    logger.error(`Failed to send password reset email to ${email}:`, error);
    // Clean up the token since email failed
    await redisClient.del(resetKey);
    throw new APIError("Failed to send password reset email", 500);
  }
};

export const resetPasswordService = async (
  token: string,
  newPassword: string
) => {
  const resetKey = `resetPassword:${token}`;
  const userId = await redisClient.get(resetKey);

  if (!userId) {
    throw new APIError("Invalid or expired reset token", 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new APIError("User not found", 404);
  }

  // Update password
  user.passwordHash = newPassword;
  await user.save();

  // Clean up reset token
  await redisClient.del(resetKey);

  // Send confirmation email
  try {
    await emailService.sendPasswordResetConfirmationEmail(user.email, {
      firstName: user.profile.firstName,
      showAdvancedTips: true,
    });
  } catch (error) {
    logger.error(
      `Failed to send password reset confirmation email to ${user.email}:`,
      error
    );
  }

  logger.info(`Password reset successfully for user: ${user.email}`);

  return { message: "Password reset successfully" };
};

// Utility function to check password reset token validity
export const validateResetTokenService = async (token: string) => {
  const resetKey = `resetPassword:${token}`;
  const userId = await redisClient.get(resetKey);

  if (!userId) {
    throw new APIError("Invalid or expired reset token", 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new APIError("User not found", 404);
  }

  return {
    valid: true,
    email: user.email,
    firstName: user.profile.firstName,
  };
};
