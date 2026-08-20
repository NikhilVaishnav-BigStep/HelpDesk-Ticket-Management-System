import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import authRoutes from "./routes/auth.routes.js";
import ticketRoutes from "./routes/ticket.routes.js";
import attachmentRoutes from "./routes/attachment.routes.js";
import slaRoutes from "./routes/sla.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import reportRoutes from "./routes/report.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Routes
app.use("/api/v1", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/tickets", ticketRoutes);
app.use("/api/v1/attachments", attachmentRoutes);
app.use("/api/v1/sla", slaRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/reports", reportRoutes);

// Error Handler
app.use(notFound);
app.use(errorHandler);

export default app;