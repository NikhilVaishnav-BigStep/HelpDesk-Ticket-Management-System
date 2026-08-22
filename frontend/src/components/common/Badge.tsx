import type { ReactNode } from "react";

type BadgeVariant =
    | "open"
    | "assigned"
    | "in_progress"
    | "resolved"
    | "closed"
    | "low"
    | "medium"
    | "high"
    | "urgent"
    | "breach"
    | "default";

interface BadgeProps {
    variant?: BadgeVariant;
    children: ReactNode;
    className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
    open: "bg-blue-50 text-blue-700 ring-blue-600/20",
    assigned: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
    in_progress: "bg-amber-50 text-amber-700 ring-amber-600/20",
    resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    closed: "bg-slate-100 text-slate-600 ring-slate-500/20",
    low: "bg-slate-100 text-slate-700 ring-slate-500/20",
    medium: "bg-blue-50 text-blue-700 ring-blue-600/20",
    high: "bg-orange-50 text-orange-700 ring-orange-600/20",
    urgent: "bg-red-50 text-red-700 ring-red-600/20",
    breach: "bg-red-100 text-red-800 ring-red-600/20",
    default: "bg-slate-100 text-slate-700 ring-slate-500/20",
};

export default function Badge({
    variant = "default",
    children,
    className = "",
}: BadgeProps) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${variantClasses[variant]} ${className}`}
        >
            {children}
        </span>
    );
}