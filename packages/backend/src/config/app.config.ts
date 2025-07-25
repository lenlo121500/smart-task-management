import { getEnv } from "../utils/get-env.utils";

const appConfig = () => ({
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: getEnv("PORT", "4000"),
  BASE_PATH: getEnv("BASE_PATH", "/api"),
  MONGO_URI: getEnv("MONGO_URI", ""),
  JWT_SECRET: getEnv("JWT_SECRET"),
  JWT_REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET"),
  JWT_EXPIRES_IN: getEnv("JWT_EXPIRES_IN", "86400"),
  REDIS_URL: getEnv("REDIS_URL"),
  ALLOWED_ORIGINS: getEnv("ALLOWED_ORIGINS", "http://localhost:5173"),
  RESEND_API_KEY: getEnv("RESEND_API_KEY"),
  RESEND_EMAIL_FROM: getEnv("EMAIL_FROM"),
  APP_NAME: getEnv("APP_NAME", "Smart Task"),
  APP_URL: getEnv("APP_URL", "http://localhost:5173"),
  SUPPORT_EMAIL: getEnv("SUPPORT_EMAIL", "support@yourapp"),
});

export const config = appConfig();
