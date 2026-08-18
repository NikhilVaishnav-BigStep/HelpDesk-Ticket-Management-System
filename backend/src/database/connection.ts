import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../logger/logger.js";

export const connectDatabase = async (): Promise<void> => {
    try {
        await mongoose.connect(env.mongoUri);

        logger.info("MongoDB connected successfully");
    } catch (error) {
        logger.error("MongoDB connection failed", error);
        process.exit(1);
    }
};

export const disconnectDatabase = async (): Promise<void> => {
    await mongoose.disconnect();
    logger.info("MongoDB disconnected");
};