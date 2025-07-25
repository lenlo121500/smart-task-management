// utils/email.constants.ts

export const EMAIL_EXPIRATION_TIMES = {
  OTP_VERIFICATION: 10, // minutes
  PASSWORD_RESET: 3600, // seconds (1 hour)
  EMAIL_VERIFICATION: 24 * 60 * 60, // seconds (24 hours)
} as const;

export const REDIS_KEYS = {
  EMAIL_VERIFICATION: (userId: string) => `emailVerification:${userId}`,
  PASSWORD_RESET: (token: string) => `resetPassword:${token}`,
  OTP_RATE_LIMIT: (email: string) => `otpRateLimit:${email}`,
} as const;

export const EMAIL_RATE_LIMITS = {
  OTP_RESEND_COOLDOWN: 60, // seconds
  MAX_OTP_ATTEMPTS_PER_HOUR: 5,
  MAX_PASSWORD_RESET_ATTEMPTS_PER_HOUR: 3,
} as const;

// Email template feature flags based on user role
export const getWelcomeEmailFeatures = (role: string): string[] => {
  const baseFeatures: string[] = [];

  switch (role) {
    case "admin":
      return [
        "Admin dashboard access",
        "User management tools",
        "Advanced analytics",
        "System configuration",
        "Audit logs",
      ];
    case "manager":
      return [
        "Team management tools",
        "Project analytics",
        "Resource allocation",
        "Performance reports",
      ];
    case "member":
    default:
      return baseFeatures;
  }
};

// Helper to generate secure tokens
export const generateSecureToken = (length: number = 32): string => {
  const crypto = require("crypto");
  return crypto.randomBytes(length).toString("hex");
};

// Helper to generate numeric OTP
export const generateNumericOTP = (length: number = 6): string => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
};

// Email validation helper
export const validateEmailFormat = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Generate reset URL with proper encoding
export const generateResetUrl = (token: string, baseUrl?: string): string => {
  const appUrl = baseUrl || process.env.APP_URL || "http://localhost:3000";
  return `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
};

// Generate verification URL
export const generateVerificationUrl = (
  userId: string,
  baseUrl?: string
): string => {
  const appUrl = baseUrl || process.env.APP_URL || "http://localhost:3000";
  return `${appUrl}/verify-email?userId=${encodeURIComponent(userId)}`;
};
