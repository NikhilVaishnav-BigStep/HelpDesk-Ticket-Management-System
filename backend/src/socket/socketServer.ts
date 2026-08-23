import type { Server as HttpServer } from "http";
import { Server, type Socket } from "socket.io";
import { verifyToken, type JwtPayload } from "../utils/jwt.js";
import { logger } from "../logger/logger.js";

export interface AuthenticatedSocket extends Socket {
    user?: JwtPayload;
}

let io: Server | null = null;

export const initSocketServer = (httpServer: HttpServer): Server => {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PUT", "DELETE"],
        },
    });

    // JWT Authentication Middleware for Socket.IO
    io.use((socket: AuthenticatedSocket, next) => {
        const token =
            socket.handshake.auth?.token ||
            socket.handshake.headers?.authorization?.replace("Bearer ", "");

        if (!token) {
            return next(new Error("Authentication token required"));
        }

        try {
            const payload = verifyToken(token);
            socket.user = payload;
            next();
        } catch {
            return next(new Error("Invalid or expired authentication token"));
        }
    });

    io.on("connection", (socket: AuthenticatedSocket) => {
        const userId = socket.user?.userId;
        const role = socket.user?.role;

        logger.info(`Socket connected: ${socket.id} (User: ${userId}, Role: ${role})`);

        // Join role-specific room if agent/admin
        if (role === "agent" || role === "admin") {
            socket.join("support_staff");
        }

        // Room subscription handlers for tickets
        socket.on("join_ticket", (ticketId: string) => {
            if (ticketId) {
                socket.join(`ticket:${ticketId}`);
                logger.info(`Socket ${socket.id} joined room ticket:${ticketId}`);
            }
        });

        socket.on("leave_ticket", (ticketId: string) => {
            if (ticketId) {
                socket.leave(`ticket:${ticketId}`);
                logger.info(`Socket ${socket.id} left room ticket:${ticketId}`);
            }
        });

        socket.on("disconnect", () => {
            logger.info(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getSocketIO = (): Server | null => {
    return io;
};

export const notifyTicketEvent = (
    ticketId: string,
    event: "new_comment" | "new_attachment" | "status_changed" | "ticket_assigned",
    payload?: unknown
): void => {
    if (!io) return;

    // Broadcast to ticket room
    io.to(`ticket:${ticketId}`).emit(event, { ticketId, ...((payload as object) || {}) });

    // Also broadcast status/assignment events to support staff queue room
    if (event === "status_changed" || event === "ticket_assigned") {
        io.to("support_staff").emit("queue_updated", { ticketId, event, payload });
    }
};
