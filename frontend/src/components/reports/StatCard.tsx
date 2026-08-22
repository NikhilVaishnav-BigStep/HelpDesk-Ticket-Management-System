import type { ReactNode } from "react";

interface StatCardProps {
    title: string;
    value: number | string;
    icon?: ReactNode;
    description?: string;
}

export default function StatCard({
    title,
    value,
    icon,
    description,
}: StatCardProps) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {title}
                    </p>

                    <p className="mt-2 text-3xl font-semibold text-slate-900">
                        {value}
                    </p>

                    {description && (
                        <p className="mt-1 text-xs text-slate-500">
                            {description}
                        </p>
                    )}
                </div>

                {icon && (
                    <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}