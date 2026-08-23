import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getTickets } from "@/api/ticketApi";

import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import Spinner from "@/components/common/Spinner";
import StatCard from "@/components/reports/StatCard";
import TicketTable from "@/components/tickets/TicketTable";

import type { Ticket } from "@/types/ticket.types";
import { getErrorMessage } from "@/utils/errorHelpers";

export default function CustomerDashboardPage() {
    const navigate = useNavigate();

    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadTickets() {
            setIsLoading(true);
            setError(null);

            try {
                const response = await getTickets({
                    page: 1,
                    limit: 10,
                });

                setTickets(response.tickets);
            } catch (error) {
                setError(getErrorMessage(error));
            } finally {
                setIsLoading(false);
            }
        }

        loadTickets();
    }, []);

    const ticketStats = useMemo(() => {
        return {
            open: tickets.filter((ticket) => ticket.status === "open").length,

            inProgress: tickets.filter(
                (ticket) => ticket.status === "in_progress"
            ).length,

            resolved: tickets.filter(
                (ticket) =>
                    ticket.status === "resolved" ||
                    ticket.status === "closed"
            ).length,
        };
    }, [tickets]);

    if (isLoading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Customer Dashboard
                    </h1>

                    <p className="mt-1 text-sm text-slate-600">
                        Manage and track your support tickets.
                    </p>
                </div>

                <Button
                    variant="primary"
                    onClick={() => navigate("/customer/tickets/new")}
                >
                    New Ticket
                </Button>
            </div>

            {error && (
                <Alert variant="error">
                    {error}
                </Alert>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    title="Open Tickets"
                    value={ticketStats.open}
                    description="Tickets waiting for support"
                />

                <StatCard
                    title="In Progress"
                    value={ticketStats.inProgress}
                    description="Tickets currently being handled"
                />

                <StatCard
                    title="Resolved"
                    value={ticketStats.resolved}
                    description="Resolved or closed tickets"
                />
            </div>

            <section>
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Recent Tickets
                        </h2>

                        <p className="text-sm text-slate-500">
                            Your most recently created support tickets.
                        </p>
                    </div>

                    {tickets.length > 0 && (
                        <span className="text-sm text-slate-500">
                            {tickets.length} ticket
                            {tickets.length !== 1 ? "s" : ""}
                        </span>
                    )}
                </div>

                <TicketTable tickets={tickets} />
            </section>
        </div>
    );
}