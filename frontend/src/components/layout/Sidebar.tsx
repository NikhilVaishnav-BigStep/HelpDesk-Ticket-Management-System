import { NavLink } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { navigationItems } from "@/utils/navigation";

export default function Sidebar() {
    const { user } = useAuth();

    if (!user) {
        return null;
    }

    const visibleItems = navigationItems.filter((item) =>
        item.roles.includes(user.role),
    );

    return (
        <aside className="hidden min-h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
            <nav className="space-y-1 p-4">
                {visibleItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
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
        </aside>
    );
}