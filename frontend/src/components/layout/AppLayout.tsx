import { useState } from "react";
import { Outlet } from "react-router-dom";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function AppLayout() {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar
                onToggleMobileSidebar={() =>
                    setIsMobileSidebarOpen((prev) => !prev)
                }
            />

            <div className="flex">
                <Sidebar
                    isMobileOpen={isMobileSidebarOpen}
                    onCloseMobile={() => setIsMobileSidebarOpen(false)}
                />

                <main className="min-w-0 flex-1 overflow-y-auto">
                    <div className="p-4 sm:p-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}