import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { connectSocket, disconnectSocket, getSocket } from "@/api/socket";

export function useSocket() {
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            connectSocket();
        } else {
            disconnectSocket();
        }
    }, [isAuthenticated]);

    return {
        socket: getSocket(),
        joinTicket: (ticketId: string) => {
            const socket = getSocket();
            if (socket.connected) {
                socket.emit("join_ticket", ticketId);
            } else {
                socket.once("connect", () => {
                    socket.emit("join_ticket", ticketId);
                });
            }
        },
        leaveTicket: (ticketId: string) => {
            const socket = getSocket();
            if (socket.connected) {
                socket.emit("leave_ticket", ticketId);
            }
        },
    };
}
