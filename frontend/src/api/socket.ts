import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
    if (!socket) {
        // Derives backend origin URL from VITE_API_BASE_URL (e.g. http://localhost:5000)
        const apiBase =
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
        const socketUrl = apiBase.replace(/\/api\/v1\/?$/, "");

        const token = localStorage.getItem("helpdesk_token") || "";

        socket = io(socketUrl, {
            autoConnect: false,
            auth: {
                token,
            },
            transports: ["websocket", "polling"],
        });
    }

    return socket;
};

export const connectSocket = (): Socket => {
    const s = getSocket();
    const token = localStorage.getItem("helpdesk_token") || "";

    if (s.auth) {
        (s.auth as { token: string }).token = token;
    }

    if (!s.connected) {
        s.connect();
    }

    return s;
};

export const disconnectSocket = (): void => {
    if (socket && socket.connected) {
        socket.disconnect();
    }
};
