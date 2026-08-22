import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getTicketById } from "@/api/ticketApi";
import { getTicketTimeline } from "@/api/timelineApi";

import { useAuth } from "@/hooks/useAuth";

import TicketTimeline from "@/components/tickets/TicketTimeline";
import CommentBox from "@/components/tickets/CommentBox";
import AttachmentList from "@/components/tickets/AttachmentList";

import Alert from "@/components/common/Alert";
import Badge from "@/components/common/Badge";
import Spinner from "@/components/common/Spinner";

import type {
    Attachment,
    Ticket,
    TicketTimeline as TicketTimelineData,
} from "@/types/ticket.types";

import { formatDateTime } from "@/utils/formatters";

export default function TicketDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [timeline, setTimeline] =
        useState<TicketTimelineData | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

            await Promise.all([
                loadTicket(),
                loadTimeline(),
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [loadTicket, loadTimeline]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleActivityAdded = useCallback(async () => {
        await loadTimeline();
        await loadTicket();
    }, [loadTimeline, loadTicket]);

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
                <Alert variant="error">
                    {error}
                </Alert>

                <Link
                    to="/customer"
                    className="inline-flex text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                    ← Back to tickets
                </Link>
            </div>
        );
    }

    if (!ticket || !id) {
        return (
            <Alert variant="error">
                Ticket could not be found.
            </Alert>
        );
    }

    const attachments: Attachment[] =
        timeline?.timeline
            .filter(
                (entry) =>
                    entry.type === "attachment"
            )
            .map((entry) => {
                const data = entry.data;

                return {
                    _id:
                        typeof data._id === "string"
                            ? data._id
                            : typeof data.id === "string"
                                ? data.id
                                : entry.id,

                    ticketId: ticket._id,

                    uploadedBy:
                        typeof data.uploadedBy === "string"
                            ? data.uploadedBy
                            : "",

                    fileName:
                        typeof data.fileName === "string"
                            ? data.fileName
                            : "Attachment",

                    storageKey:
                        typeof data.storageKey === "string"
                            ? data.storageKey
                            : "",

                    mimeType:
                        typeof data.mimeType === "string"
                            ? data.mimeType
                            : "application/octet-stream",

                    size:
                        typeof data.size === "number"
                            ? data.size
                            : 0,

                    createdAt: entry.createdAt,
                };
            }) ?? [];

    const isCustomer = user?.role === "customer";

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <Link
                        to={
                            isCustomer
                                ? "/customer"
                                : "/agent/queue"
                        }
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
                        {ticket.status.replaceAll(
                            "_",
                            " "
                        )}
                    </Badge>

                    <Badge
                        variant={ticket.priority}
                    >
                        {ticket.priority}
                    </Badge>

                    {ticket.breached && (
                        <Badge variant="breach">
                            SLA Breached
                        </Badge>
                    )}
                </div>
            </div>

            {error && (
                <Alert variant="error">
                    {error}
                </Alert>
            )}

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
                                {formatDateTime(
                                    ticket.createdAt
                                )}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Last updated
                            </p>

                            <p className="mt-1 text-sm text-slate-700">
                                {formatDateTime(
                                    ticket.updatedAt
                                )}
                            </p>
                        </div>

                        {ticket.responseDueAt && (
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Response due
                                </p>

                                <p className="mt-1 text-sm text-slate-700">
                                    {formatDateTime(
                                        ticket.responseDueAt
                                    )}
                                </p>
                            </div>
                        )}

                        {ticket.resolutionDueAt && (
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Resolution due
                                </p>

                                <p className="mt-1 text-sm text-slate-700">
                                    {formatDateTime(
                                        ticket.resolutionDueAt
                                    )}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <TicketTimeline
                timeline={timeline?.timeline ?? []}
            />

            {/* Attachments */}
            <AttachmentList
                ticketId={ticket._id}
                attachments={attachments}
                onAttachmentUploaded={
                    handleActivityAdded
                }
            />

            {/* Comment box */}
            {!(
                ticket.status === "closed"
            ) && (
                <CommentBox
                    ticketId={ticket._id}
                    onCommentAdded={
                        handleActivityAdded
                    }
                />
            )}
        </div>
    );
}