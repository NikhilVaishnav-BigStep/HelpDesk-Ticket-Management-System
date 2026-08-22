import type { ReactNode } from "react";

type AlertVariant = "success" | "info" | "warning" | "error";

interface AlertProps {
    variant?: AlertVariant;
    title?: string;
    children: ReactNode;
    className?: string;
}

const variantClasses: Record<
    AlertVariant,
    {
        container: string;
        title: string;
        text: string;
    }
> = {
    success: {
        container: "border-emerald-200 bg-emerald-50",
        title: "text-emerald-800",
        text: "text-emerald-700",
    },
    info: {
        container: "border-blue-200 bg-blue-50",
        title: "text-blue-800",
        text: "text-blue-700",
    },
    warning: {
        container: "border-amber-200 bg-amber-50",
        title: "text-amber-800",
        text: "text-amber-700",
    },
    error: {
        container: "border-red-200 bg-red-50",
        title: "text-red-800",
        text: "text-red-700",
    },
};

export default function Alert({
    variant = "info",
    title,
    children,
    className = "",
}: AlertProps) {
    const styles = variantClasses[variant];

    return (
        <div
            className={`rounded-lg border p-4 ${styles.container} ${className}`}
            role={variant === "error" ? "alert" : "status"}
        >
            {title && (
                <h3 className={`text-sm font-semibold ${styles.title}`}>{title}</h3>
            )}

            <div className={`text-sm ${title ? "mt-1" : ""} ${styles.text}`}>
                {children}
            </div>
        </div>
    );
}