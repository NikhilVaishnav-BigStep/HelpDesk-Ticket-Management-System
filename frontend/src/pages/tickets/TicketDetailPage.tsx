import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
    getTicketById,
    assignTicket,
    changeTicketStatus,
    reopenTicket,
} from "@/api/ticketApi";
import { getTicketTimeline } from "@/api/timelineApi";
import { getUsers } from "@/api/userApi";

import { useAuth } from "@/hooks/useAuth";

import TicketTimeline from "@/components/tickets/TicketTimeline";
import ChatInputBar from "@/components/tickets/ChatInputBar";

import Alert from "@/components/common/Alert";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Select from "@/components/common/Select";
import Spinner from "@/components/common/Spinner";

import type {
    Ticket,
    TicketStatus,
    TicketTimeline as TicketTimelineData,
} from "@/types/ticket.types";
import type { User } from "@/types/user.types";

import { formatDateTime } from "@/utils/formatters";
import { getErrorMessage } from "@/utils/errorHelpers";

// Valid status transitions enforced on the frontend
const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
    open: ["assigned"],
    assigned: ["in_progress"],
    in_progress: ["resolved"],
    resolved: ["closed"],
    closed: [], // must use reopen endpoint
};

const STATUS_LABELS: Record<TicketStatus, string> = {
    open: "Open",
    assigned: "Assigned",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
};

export default function TicketDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [timeline, setTimeline] = useState<TicketTimelineData | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);

    // Agent/admin controls
    const [agents, setAgents] = useState<User[]>([]);
    const [isAssigning, setIsAssigning] = useState(false);
    const [isChangingStatus, setIsChangingStatus] = useState(false);
    const [isReopening, setIsReopening] = useState(false);

    const isSupportStaff =
        user?.role === "agent" || user?.role === "admin";
    const isAdmin = user?.role === "admin";
    const isCustomer = user?.role === "customer";

    // ── Data loading ──────────────────────────────────────

    const loadTicket = useCallback(async () => {
        if (!id) {
            setError("Invalid ticket ID.");
            return;
        }

        try {
            const data = await getTicketById(id);
            setTicket(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load the ticket."
            );
        }
    }, [id]);

    const loadTimeline = useCallback(async () => {
        if (!id) {
            return;
        }

        try {
            const data = await getTicketTimeline(id);
            setTimeline(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load the ticket timeline."
            );
        }
    }, [id]);

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            await Promise.all([loadTicket(), loadTimeline()]);
        } finally {
            setIsLoading(false);
        }
    }, [loadTicket, loadTimeline]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Load agents for assignee dropdown (ADMIN ONLY because GET /users requires admin role)
    useEffect(() => {
        if (!isAdmin) return;

        async function loadAgents() {
            try {
                const agentData = await getUsers({
                    role: "agent",
                    limit: 100,
                });
                const adminData = await getUsers({
                    role: "admin",
                    limit: 100,
                });
                setAgents([...agentData.users, ...adminData.users]);
            } catch {
                // Agent list unavailable
            }
        }

        loadAgents();
    }, [isAdmin]);

    const handleActivityAdded = useCallback(async () => {
        await loadTimeline();
        await loadTicket();
    }, [loadTimeline, loadTicket]);

    // ── Assignment handler ────────────────────────────────

    async function handleAssign(assigneeId: string) {
        if (!ticket || !assigneeId) return;

        try {
            setIsAssigning(true);
            setError(null);
            setActionSuccess(null);

            const updated = await assignTicket(ticket._id, assigneeId);
            setTicket(updated);
            setActionSuccess("Ticket assigned successfully.");
            await loadTimeline();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsAssigning(false);
        }
    }

    // ── Status change handler ─────────────────────────────

    async function handleStatusChange(newStatus: TicketStatus) {
        if (!ticket) return;

        try {
            setIsChangingStatus(true);
            setError(null);
            setActionSuccess(null);

            const updated = await changeTicketStatus(ticket._id, newStatus);
            setTicket(updated);
            setActionSuccess(
                `Status changed to "${STATUS_LABELS[newStatus]}".`
            );
            await loadTimeline();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsChangingStatus(false);
        }
    }

    // ── Reopen handler ────────────────────────────────────

    async function handleReopen() {
        if (!ticket) return;

        try {
            setIsReopening(true);
            setError(null);
            setActionSuccess(null);

            const updated = await reopenTicket(ticket._id);
            setTicket(updated);
            setActionSuccess("Ticket reopened successfully.");
            await loadTimeline();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsReopening(false);
        }
    }

    // ── Render states ─────────────────────────────────────

    if (isLoading) {
        return (
            <div className="flex justify-center py-16">
                <Spinner />
            </div>
        );
    }

    if (error && !ticket) {
        return (
            <div className="space-y-4">
                <Alert variant="error">{error}</Alert>

                <Link
                    to={isCustomer ? "/customer" : "/agent/queue"}
                    className="inline-flex text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                    ← Back to tickets
                </Link>
            </div>
        );
    }

    if (!ticket || !id) {
        return <Alert variant="error">Ticket could not be found.</Alert>;
    }

    const validNextStatuses = VALID_TRANSITIONS[ticket.status] ?? [];
    const isClosed = ticket.status === "closed";
    const isAssignedToCurrentAgent =
        typeof ticket.assigneeId === "string"
            ? ticket.assigneeId === user?._id
            : (ticket.assigneeId as unknown as { _id: string })?._id === user?._id;

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <Link
                        to={isCustomer ? "/customer" : "/agent/queue"}
                        className="mb-3 inline-flex text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                        ← Back to tickets
                    </Link>

                    <h1 className="text-2xl font-bold text-slate-900">
                        {ticket.subject}
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Ticket #{ticket._id}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Badge variant={ticket.status}>
                        {ticket.status.replaceAll("_", " ")}
                    </Badge>

                    <Badge variant={ticket.priority}>{ticket.priority}</Badge>

                    {ticket.breached && (
                        <Badge variant="breach">SLA Breached</Badge>
                    )}
                </div>
            </div>

            {/* Feedback banners */}
            {actionSuccess && <Alert variant="success">{actionSuccess}</Alert>}

            {error && <Alert variant="error">{error}</Alert>}

            {/* Ticket information */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid gap-6 md:grid-cols-2">
                    <div>
                        <h2 className="text-sm font-medium text-slate-500">
                            Description
                        </h2>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                            {ticket.description}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Created
                            </p>

                            <p className="mt-1 text-sm text-slate-700">
                                {formatDateTime(ticket.createdAt)}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Last updated
                            </p>

                            <p className="mt-1 text-sm text-slate-700">
                                {formatDateTime(ticket.updatedAt)}
                            </p>
                        </div>

                        {ticket.responseDueAt && (
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Response due
                                </p>

                                <p className="mt-1 text-sm text-slate-700">
                                    {formatDateTime(ticket.responseDueAt)}
                                </p>
                            </div>
                        )}

                        {ticket.resolutionDueAt && (
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Resolution due
                                </p>

                                <p className="mt-1 text-sm text-slate-700">
                                    {formatDateTime(ticket.resolutionDueAt)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Agent/Admin actions panel */}
            {isSupportStaff && (
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-base font-semibold text-slate-900">
                        Ticket Actions
                    </h2>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Assign: Admin sees dropdown, Agent sees "Assign to Me" */}
                        <div>
                            {isAdmin ? (
                                <Select
                                    id="assignee-select"
                                    label="Assign to Agent"
                                    value={
                                        typeof ticket.assigneeId === "string"
                                            ? ticket.assigneeId
                                            : (ticket.assigneeId as unknown as { _id: string })?._id ?? ""
                                    }
                                    onChange={(e) => handleAssign(e.target.value)}
                                    disabled={isAssigning || isClosed}
                                >
                                    <option value="">Unassigned</option>
                                    {agents.map((agent) => (
                                        <option key={agent._id} value={agent._id}>
                                            {agent.name} ({agent.role})
                                        </option>
                                    ))}
                                </Select>
                            ) : (
                                <div>
                                    <p className="mb-1.5 text-sm font-medium text-slate-700">
                                        Assignment
                                    </p>
                                    {isAssignedToCurrentAgent ? (
                                        <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 border border-emerald-200">
                                            ✓ Assigned to You
                                        </div>
                                    ) : (
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleAssign(user?._id ?? "")}
                                            loading={isAssigning}
                                            disabled={isAssigning || isClosed || !user?._id}
                                        >
                                            Assign to Me
                                        </Button>
                                    )}
                                </div>
                            )}

                            {isAssigning && (
                                <p className="mt-1 text-xs text-slate-500">
                                    Assigning...
                                </p>
                            )}
                        </div>

                        {/* Status transition */}
                        <div>
                            {isClosed ? (
                                <div>
                                    <p className="mb-1.5 text-sm font-medium text-slate-700">
                                        Status
                                    </p>
                                    <p className="mb-3 text-sm text-slate-500">
                                        This ticket is closed. Reopen it to make
                                        further changes.
                                    </p>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleReopen}
                                        loading={isReopening}
                                    >
                                        Reopen Ticket
                                    </Button>
                                </div>
                            ) : (
                                <div>
                                    <p className="mb-1.5 text-sm font-medium text-slate-700">
                                        Change Status
                                    </p>

                                    {validNextStatuses.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {validNextStatuses.map(
                                                (status) => (
                                                    <Button
                                                        key={status}
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleStatusChange(
                                                                status
                                                            )
                                                        }
                                                        loading={
                                                            isChangingStatus
                                                        }
                                                    >
                                                        → {STATUS_LABELS[status]}
                                                    </Button>
                                                )
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500">
                                            No further status transitions
                                            available.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Unified Conversation & History Chat Section */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col">
                <div className="border-b border-slate-200 px-5 py-4 bg-slate-50/50 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">
                            Conversation & History
                        </h2>
                        <p className="text-xs text-slate-500">
                            Activity feed, comments, and attachments
                        </p>
                    </div>

                    <span className="text-xs font-medium text-slate-500">
                        {timeline?.timeline.length ?? 0} total entries
                    </span>
                </div>

                {/* Timeline Messages Stream */}
                <div className="max-h-[600px] min-h-[300px] overflow-y-auto bg-slate-50/30">
                    <TicketTimeline timeline={timeline?.timeline ?? []} />
                </div>

                {/* Sticky Bottom Chat Input Bar with Attachment Paperclip */}
                <ChatInputBar
                    ticketId={ticket._id}
                    isClosed={isClosed}
                    onActivityAdded={handleActivityAdded}
                />
            </section>
        </div>
    );
}