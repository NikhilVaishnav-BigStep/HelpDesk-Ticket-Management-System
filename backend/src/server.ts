import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./database/connection.js";
import { logger } from "./logger/logger.js";

const startServer = async (): Promise<void> => {
    await connectDatabase();

    app.listen(env.port, () => {
        logger.info(`Server running on port ${env.port}`);
    });
};

const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received. Shutting down server...`);

    await disconnectDatabase();

    process.exit(0);
};

startServer();
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));