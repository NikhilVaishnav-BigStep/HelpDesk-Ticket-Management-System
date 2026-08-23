import { NavLink } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { navigationItems } from "@/utils/navigation";

interface SidebarProps {
    isMobileOpen?: boolean;
    onCloseMobile?: () => void;
}

export default function Sidebar({
    isMobileOpen = false,
    onCloseMobile,
}: SidebarProps) {
    const { user } = useAuth();

    if (!user) {
        return null;
    }

    const visibleItems = navigationItems.filter((item) =>
        item.roles.includes(user.role)
    );

    const navContent = (
        <nav className="space-y-1 p-4">
            {visibleItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                        [
                            "block rounded-lg px-4 py-2.5 text-sm font-medium transition",
                            isActive
                                ? "bg-blue-50 text-blue-700"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                        ].join(" ")
                    }
                >
                    {item.label}
                </NavLink>
            ))}
        </nav>
    );

    return (
        <>
            {/* Desktop fixed sidebar */}
            <aside className="hidden min-h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
                {navContent}
            </aside>

            {/* Mobile Drawer Backdrop & Sidebar */}
            {isMobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden flex">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
                        onClick={onCloseMobile}
                        aria-hidden="true"
                    />

                    {/* Drawer Content */}
                    <div className="relative z-10 flex w-72 max-w-full flex-col bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                            <span className="text-sm font-bold text-slate-900">
                                Navigation
                            </span>
                            <button
                                type="button"
                                onClick={onCloseMobile}
                                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Close Navigation Menu"
                            >
                                <span className="text-xl leading-none">&times;</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">{navContent}</div>
                    </div>
                </div>
            )}
        </>
    );
}