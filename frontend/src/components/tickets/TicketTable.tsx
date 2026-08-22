import { useNavigate } from "react-router-dom";

import Badge from "@/components/common/Badge";
import EmptyState from "@/components/common/EmptyState";

import type { Ticket } from "@/types/ticket.types";
import { formatDateTime } from "@/utils/formatters";

interface TicketTableProps {
    tickets: Ticket[];
    /** Show agent-specific columns (Customer, Assignee, SLA) */
    variant?: "customer" | "agent";
    /** Enable multi-select checkboxes */
    selectable?: boolean;
    /** Currently selected ticket IDs (controlled) */
    selectedIds?: Set<string>;
    /** Called when selection changes */
    onSelectionChange?: (selectedIds: Set<string>) => void;
}

export default function TicketTable({
    tickets,
    variant = "customer",
    selectable = false,
    selectedIds = new Set(),
    onSelectionChange,
}: TicketTableProps) {
    const navigate = useNavigate();
    const isAgent = variant === "agent";

    if (tickets.length === 0) {
        return (
            <EmptyState
                title="No tickets found"
                description={
                    isAgent
                        ? "No tickets match the current filters."
                        : "You haven't created any support tickets yet."
                }
            />
        );
    }

    function handleSelectAll(checked: boolean) {
        if (!onSelectionChange) return;

        if (checked) {
            const allIds = new Set(tickets.map((t) => t._id));
            onSelectionChange(allIds);
        } else {
            onSelectionChange(new Set());
        }
    }

    function handleSelectOne(ticketId: string, checked: boolean) {
        if (!onSelectionChange) return;

        const next = new Set(selectedIds);

        if (checked) {
            next.add(ticketId);
        } else {
            next.delete(ticketId);
        }

        onSelectionChange(next);
    }

    const allSelected =
        tickets.length > 0 && tickets.every((t) => selectedIds.has(t._id));
    const someSelected =
        tickets.some((t) => selectedIds.has(t._id)) && !allSelected;

    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        {selectable && (
                            <th className="w-12 px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={(el) => {
                                        if (el) el.indeterminate = someSelected;
                                    }}
                                    onChange={(e) =>
                                        handleSelectAll(e.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    aria-label="Select all tickets"
                                />
                            </th>
                        )}

                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Subject
                        </th>

                        {isAgent && (
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Customer
                            </th>
                        )}

                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Status
                        </th>

                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Priority
                        </th>

                        {isAgent && (
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                SLA
                            </th>
                        )}

                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Created
                        </th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                    {tickets.map((ticket) => {
                        const isSelected = selectedIds.has(ticket._id);

                        return (
                            <tr
                                key={ticket._id}
                                onClick={() =>
                                    navigate(`/tickets/${ticket._id}`)
                                }
                                className={`cursor-pointer transition hover:bg-slate-50 ${
                                    isSelected ? "bg-blue-50/50" : ""
                                }`}
                            >
                                {selectable && (
                                    <td
                                        className="w-12 px-4 py-4"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) =>
                                                handleSelectOne(
                                                    ticket._id,
                                                    e.target.checked
                                                )
                                            }
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            aria-label={`Select ticket ${ticket.subject}`}
                                        />
                                    </td>
                                )}

                                <td className="px-6 py-4">
                                    <p className="max-w-xs truncate text-sm font-medium text-slate-900">
                                        {ticket.subject}
                                    </p>
                                </td>

                                {isAgent && (
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                        {getPopulatedName(ticket.customerId)}
                                    </td>
                                )}

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

                                {isAgent && (
                                    <td className="whitespace-nowrap px-6 py-4">
                                        {ticket.breached ? (
                                            <Badge variant="breach">
                                                Breached
                                            </Badge>
                                        ) : ticket.resolutionDueAt ? (
                                            <span className="text-xs text-slate-500">
                                                Due{" "}
                                                {formatDateTime(
                                                    ticket.resolutionDueAt
                                                )}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-400">
                                                —
                                            </span>
                                        )}
                                    </td>
                                )}

                                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                                    {new Intl.DateTimeFormat("en-IN", {
                                        dateStyle: "medium",
                                    }).format(new Date(ticket.createdAt))}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// Helper types for populated ticket data from the backend
interface PopulatedUser {
    _id: string;
    name: string;
    email: string;
}

/**
 * Safely extract a populated user's name from a field that may be
 * either a plain string ID or a populated user object.
 */
function getPopulatedName(
    value: string | null | undefined
): string {
    if (!value) return "—";

    // If the backend populates the field, it becomes an object at runtime
    if (typeof value === "object" && value !== null) {
        return (value as unknown as PopulatedUser).name ?? "—";
    }

    return "—";
}