import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";

import { config } from "./config/app.config";
import logger from "./utils/logger.utils";
import connectDatabase from "./config/database.config";
import { errorHandler } from "./middleware/error.middleware";
import { corsConfig } from "./config/cors.config";

const app = express();

const BASE_PATH = config.BASE_PATH;

app.use(helmet());
app.use(cors(corsConfig));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(errorHandler);

app.listen(config.PORT, async () => {
  await connectDatabase();
  logger.info(`Server running on port ${config.PORT}`);
});
