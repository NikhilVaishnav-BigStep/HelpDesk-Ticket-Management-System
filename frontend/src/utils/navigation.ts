import type { UserRole } from "@/types/user.types";

export interface NavItem {
    label: string;
    path: string;
    roles: UserRole[];
}

export const navigationItems: NavItem[] = [
    {
        label: "Dashboard",
        path: "/customer",
        roles: ["customer"],
    },
    {
        label: "Create Ticket",
        path: "/tickets/create",
        roles: ["customer"],
    },
    {
        label: "Agent Queue",
        path: "/agent/queue",
        roles: ["agent", "admin"],
    },
    {
        label: "Reports",
        path: "/admin/reports",
        roles: ["admin"],
    },
    {
        label: "User Management",
        path: "/admin/users",
        roles: ["admin"],
    },
    {
        label: "Categories",
        path: "/admin/categories",
        roles: ["admin"],
    },
    {
        label: "SLA Configuration",
        path: "/admin/sla",
        roles: ["admin"],
    },
];