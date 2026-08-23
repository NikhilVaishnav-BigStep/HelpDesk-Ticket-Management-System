import { Link } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { getRoleLabel } from "@/utils/constants";

interface NavbarProps {
    onToggleMobileSidebar?: () => void;
}

export default function Navbar({ onToggleMobileSidebar }: NavbarProps) {
    const { user, logout } = useAuth();

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6">
                <div className="flex items-center gap-3">
                    {/* Hamburger Button for Mobile */}
                    {user && (
                        <button
                            type="button"
                            onClick={onToggleMobileSidebar}
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden"
                            aria-label="Toggle Navigation Menu"
                        >
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                        </button>
                    )}

                    <Link
                        to="/"
                        className="text-lg font-bold text-blue-600"
                    >
                        HelpDesk
                    </Link>
                </div>

                {user && (
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Link
                            to="/profile"
                            className="text-sm font-medium text-slate-700 transition hover:text-blue-600"
                        >
                            {user.name}
                        </Link>

                        <span className="hidden sm:inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                            {getRoleLabel(user.role)}
                        </span>

                        <button
                            type="button"
                            onClick={logout}
                            className="text-sm font-medium text-slate-500 transition hover:text-red-600"
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}