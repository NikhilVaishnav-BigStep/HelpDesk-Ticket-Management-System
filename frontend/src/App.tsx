import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "@/components/layout/ProtectedRoute";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";

import CustomerDashboardPage from "@/pages/customer/CustomerDashboardPage";

import CreateTicketPage from "@/pages/customer/CreateTicketPage";
import TicketDetailPage from "@/pages/tickets/TicketDetailPage";

import AgentQueuePage from "@/pages/agent/AgentQueuePage";

import AdminReportsPage from "@/pages/admin/AdminReportsPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminCategoriesPage from "@/pages/admin/AdminCategoriesPage";
import AdminSlaPage from "@/pages/admin/AdminSlaPage";

import UnauthorizedPage from "@/pages/errors/UnauthorizedPage";
import NotFoundPage from "@/pages/errors/NotFoundPage";
import ProfilePage from "@/pages/profile/ProfilePage";

import { useAuth } from "@/hooks/useAuth";

import AppLayout from "@/components/layout/AppLayout";

function HomeRedirect() {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    switch (user.role) {
        case "customer":
            return <Navigate to="/customer" replace />;

        case "agent":
            return <Navigate to="/agent/queue" replace />;

        case "admin":
            return <Navigate to="/admin/reports" replace />;

        default:
            return <Navigate to="/unauthorized" replace />;
    }
}

export default function App() {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                    <Route path="/" element={<HomeRedirect />} />

                    {/* Ticket Detail — accessible to ALL authenticated roles */}
                    <Route
                        path="/tickets/:id"
                        element={<TicketDetailPage />}
                    />

                    {/* Profile — accessible to all authenticated roles */}
                    <Route
                        path="/profile"
                        element={<ProfilePage />}
                    />

                    {/* Customer */}
                    <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
                        <Route
                            path="/customer"
                            element={<CustomerDashboardPage />}
                        />

                        <Route
                            path="/customer/tickets/new"
                            element={<CreateTicketPage />}
                        />

                        <Route
                            path="/tickets/create"
                            element={<CreateTicketPage />}
                        />
                    </Route>

                    {/* Agent / Admin */}
                    <Route
                        element={
                            <ProtectedRoute
                                allowedRoles={["agent", "admin"]}
                            />
                        }
                    >
                        <Route
                            path="/agent/queue"
                            element={<AgentQueuePage />}
                        />
                    </Route>

                    {/* Admin */}
                    <Route
                        element={<ProtectedRoute allowedRoles={["admin"]} />}
                    >
                        <Route
                            path="/admin/reports"
                            element={<AdminReportsPage />}
                        />
                        <Route
                            path="/admin/users"
                            element={<AdminUsersPage />}
                        />
                        <Route
                            path="/admin/categories"
                            element={<AdminCategoriesPage />}
                        />
                        <Route
                            path="/admin/sla"
                            element={<AdminSlaPage />}
                        />
                    </Route>
                </Route>
            </Route>

            {/* Error routes */}
            <Route
                path="/unauthorized"
                element={<UnauthorizedPage />}
            />

            <Route
                path="*"
                element={<NotFoundPage />}
            />
        </Routes>
    );
}