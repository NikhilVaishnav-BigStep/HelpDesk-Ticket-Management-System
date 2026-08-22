import { Outlet } from "react-router-dom";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function AppLayout() {
    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="flex">
                <Sidebar />

                <main className="min-w-0 flex-1 overflow-y-auto">
                    <div className="p-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}