import { createClient } from "redis";
import { config } from "../config/app.config";
import logger from "./logger.utils";

const redisClient = createClient({
  url: config.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => logger.error("Redis Client Error", err));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    logger.info("🟢 Redis connected");
  }
};

export default redisClient;
