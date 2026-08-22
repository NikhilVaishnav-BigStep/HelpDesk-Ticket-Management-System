import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getTicketById } from "@/api/ticketApi";

import Alert from "@/components/common/Alert";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Spinner from "@/components/common/Spinner";

import type { Ticket } from "@/types/ticket.types";
import { getErrorMessage } from "@/utils/errorHelpers";

export default function TicketDetailPage() {
    const { id } = useParams<{ id: string }>();

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadTicket() {
            if (!id) {
                setError("Ticket ID is missing.");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const data = await getTicketById(id);
                setTicket(data);
            } catch (error) {
                setError(getErrorMessage(error));
            } finally {
                setIsLoading(false);
            }
        }

        loadTicket();
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto max-w-3xl">
                <Alert variant="error">{error}</Alert>

                <div className="mt-4">
                    <Link to="/customer">
                        <Button variant="outline">
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="mx-auto max-w-3xl">
                <Alert variant="error">
                    Ticket could not be found.
                </Alert>

                <div className="mt-4">
                    <Link to="/customer">
                        <Button variant="outline">
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="mb-2">
                        <Link
                            to="/customer"
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            ← Back to Dashboard
                        </Link>
                    </div>

                    <h1 className="text-2xl font-semibold text-slate-900">
                        {ticket.subject}
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Ticket created{" "}
                        {new Intl.DateTimeFormat("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                        }).format(new Date(ticket.createdAt))}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Badge
                        variant={ticket.status}
                    >
                        {ticket.status}
                    </Badge>

                    <Badge
                        variant={ticket.priority}
                    >
                        {ticket.priority}
                    </Badge>
                </div>
            </div>

            {/* Ticket information */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Ticket Details
                    </h2>
                </div>

                <div className="p-6">
                    <div>
                        <h3 className="mb-2 text-sm font-medium text-slate-500">
                            Description
                        </h3>

                        <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                            {ticket.description}
                        </div>
                    </div>
                </div>
            </section>

            {/* Ticket metadata */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Information
                    </h2>
                </div>

                <dl className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
                    <div>
                        <dt className="text-sm font-medium text-slate-500">
                            Status
                        </dt>

                        <dd className="mt-1">
                            <Badge
                                variant={ticket.status}
                            >
                                {ticket.status}
                            </Badge>
                        </dd>
                    </div>

                    <div>
                        <dt className="text-sm font-medium text-slate-500">
                            Priority
                        </dt>

                        <dd className="mt-1">
                            <Badge
                                variant={ticket.priority}
                            >
                                {ticket.priority}
                            </Badge>
                        </dd>
                    </div>

                    <div>
                        <dt className="text-sm font-medium text-slate-500">
                            Category
                        </dt>

                        <dd className="mt-1 text-sm text-slate-900">
                            {ticket.categoryId || "Not specified"}
                        </dd>
                    </div>

                    <div>
                        <dt className="text-sm font-medium text-slate-500">
                            Assigned To
                        </dt>

                        <dd className="mt-1 text-sm text-slate-900">
                            {ticket.assigneeId || "Not assigned"}
                        </dd>
                    </div>

                    <div>
                        <dt className="text-sm font-medium text-slate-500">
                            Created
                        </dt>

                        <dd className="mt-1 text-sm text-slate-900">
                            {new Intl.DateTimeFormat("en-IN", {
                                dateStyle: "medium",
                                timeStyle: "short",
                            }).format(new Date(ticket.createdAt))}
                        </dd>
                    </div>

                    <div>
                        <dt className="text-sm font-medium text-slate-500">
                            Last Updated
                        </dt>

                        <dd className="mt-1 text-sm text-slate-900">
                            {new Intl.DateTimeFormat("en-IN", {
                                dateStyle: "medium",
                                timeStyle: "short",
                            }).format(new Date(ticket.updatedAt))}
                        </dd>
                    </div>
                </dl>
            </section>
        </div>
    );
}