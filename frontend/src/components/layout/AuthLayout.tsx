import type { ReactNode } from "react";

interface AuthLayoutProps {
    children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white shadow-sm">
                        H
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900">
                        Helpdesk
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Ticket Management System
                    </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    {children}
                </div>
            </div>
        </main>
    );
}