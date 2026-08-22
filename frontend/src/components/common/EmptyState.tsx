import type { ReactNode } from "react";

interface EmptyStateProps {
    title: string;
    description?: string;
    action?: ReactNode;
    icon?: ReactNode;
    className?: string;
}

export default function EmptyState({
    title,
    description,
    action,
    icon,
    className = "",
}: EmptyStateProps) {
    return (
        <div
            className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center ${className}`}
        >
            {icon && (
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    {icon}
                </div>
            )}

            <h3 className="text-base font-semibold text-slate-900">{title}</h3>

            {description && (
                <p className="mt-1 max-w-md text-sm text-slate-500">
                    {description}
                </p>
            )}

            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}