import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Routes
app.use("/api/v1", healthRoutes);

// Error Handler
app.use(notFound);
app.use(errorHandler);

export default app;