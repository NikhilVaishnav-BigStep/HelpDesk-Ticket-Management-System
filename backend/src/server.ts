import http from "http";
import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./database/connection.js";
import { logger } from "./logger/logger.js";
import { initSocketServer } from "./socket/socketServer.js";

const startServer = async (): Promise<void> => {
    await connectDatabase();

    const httpServer = http.createServer(app);
    initSocketServer(httpServer);

    httpServer.listen(env.port, () => {
        logger.info(`Server running on port ${env.port} with Socket.IO enabled`);
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