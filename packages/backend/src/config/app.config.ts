import { getEnv } from "../utils/get-env.utils";

const appConfig = () => ({
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: getEnv("PORT", "4000"),
  BASE_PATH: getEnv("BASE_PATH", "/api"),
  MONGO_URI: getEnv("MONGO_URI", ""),
  JWT_SECRET: getEnv("JWT_SECRET"),
  JWT_EXPIRES_IN: getEnv("JWT_EXPIRES_IN", "86400"),
  REDIS_URL: getEnv("REDIS_URL"),
  ALLOWED_ORIGINS: getEnv("ALLOWED_ORIGINS", "http://localhost:5173"),
});

export const config = appConfig();
