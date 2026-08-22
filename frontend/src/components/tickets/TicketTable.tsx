import { useNavigate } from "react-router-dom";

import Badge from "@/components/common/Badge";
import EmptyState from "@/components/common/EmptyState";

import type { Ticket } from "@/types/ticket.types";

interface TicketTableProps {
    tickets: Ticket[];
}

export default function TicketTable({ tickets }: TicketTableProps) {
    const navigate = useNavigate();

    if (tickets.length === 0) {
        return (
            <EmptyState
                title="No tickets found"
                description="You haven't created any support tickets yet."
            />
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Subject
                        </th>

                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Status
                        </th>

                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Priority
                        </th>

                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Created
                        </th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                    {tickets.map((ticket) => (
                        <tr
                            key={ticket._id}
                            onClick={() =>
                                navigate(`/tickets/${ticket._id}`)
                            }
                            className="cursor-pointer transition hover:bg-slate-50"
                        >
                            <td className="px-6 py-4">
                                <p className="max-w-md truncate text-sm font-medium text-slate-900">
                                    {ticket.subject}
                                </p>
                            </td>

                            <td className="whitespace-nowrap px-6 py-4">
                                <Badge variant={ticket.status}>
                                    {ticket.status
                                        .replace(/_/g, " ")
                                        .replace(/\b\w/g, (c) =>
                                            c.toUpperCase()
                                        )}
                                </Badge>
                            </td>

                            <td className="whitespace-nowrap px-6 py-4">
                                <Badge variant={ticket.priority}>
                                    {ticket.priority.charAt(0).toUpperCase() +
                                        ticket.priority.slice(1)}
                                </Badge>
                            </td>

                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                                {new Intl.DateTimeFormat("en-IN", {
                                    dateStyle: "medium",
                                }).format(new Date(ticket.createdAt))}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}