import mongoose from "mongoose";
import logger from "../utils/logger.utils";
import { config } from "./app.config";

const connectDatabase = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    logger.info("Database connected");
  } catch (error) {
    logger.error(`Database connection error: ${error}`);
    process.exit(1);
  }
};

export default connectDatabase;
