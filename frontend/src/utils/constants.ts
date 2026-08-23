import type { UserRole } from "@/types/user.types";

export const APP_NAME = "Helpdesk";

export const STORAGE_KEYS = {
    TOKEN: "helpdesk_token",
    USER: "helpdesk_user",
} as const;

export const getRoleLabel = (role: UserRole): string => {
    switch (role) {
        case "customer":
            return "Customer";

        case "agent":
            return "Agent";

        case "admin":
            return "Administrator";

        default:
            return role;
    }
};