import { Link } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { getRoleLabel } from "@/utils/constants";

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
            <div className="flex h-16 items-center justify-between px-6">
                <Link
                    to="/"
                    className="text-lg font-bold text-blue-600"
                >
                    HelpDesk
                </Link>

                {user && (
                    <div className="flex items-center gap-4">
                        <Link
                            to="/profile"
                            className="hidden text-sm text-slate-600 transition hover:text-blue-600 sm:block"
                        >
                            {user.name}
                        </Link>

                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                            {getRoleLabel(user.role)}
                        </span>

                        <button
                            type="button"
                            onClick={logout}
                            className="text-sm font-medium text-slate-600 transition hover:text-red-600"
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}