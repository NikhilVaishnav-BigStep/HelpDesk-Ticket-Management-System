import { useState } from "react";
import type { TimelineEntry } from "@/types/ticket.types";
import { useAuth } from "@/hooks/useAuth";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import { formatDateTime } from "@/utils/formatters";
import { downloadAttachment } from "@/api/attachmentApi";
import { getErrorMessage } from "@/utils/errorHelpers";

interface TicketTimelineProps {
    timeline: TimelineEntry[];
}

function getActorName(actor: TimelineEntry["actor"]) {
    if (!actor) {
        return "System";
    }

    const actorRecord = actor as Record<string, unknown>;

    return typeof actorRecord.name === "string"
        ? actorRecord.name
        : "Unknown user";
}

function formatFileSize(size: number) {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TicketTimeline({ timeline }: TicketTimelineProps) {
    const { user } = useAuth();
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const isSupportStaff =
        user?.role === "agent" || user?.role === "admin";

    const visibleEntries = timeline.filter((entry) => {
        // Internal comments are support staff only
        if (entry.type === "comment") {
            if (entry.data.type === "internal") {
                return isSupportStaff;
            }
            return true;
        }

        // Attachments are visible to all users (customers + support staff)
        if (entry.type === "attachment") {
            return true;
        }

        // System history logs are support staff only
        if (entry.type === "history") {
            return isSupportStaff;
        }

        return false;
    });

    async function handleDownloadAttachment(attachmentId: string, fileName: string) {
        try {
            setDownloadingId(attachmentId);
            setError(null);

            const blob = await downloadAttachment(attachmentId);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setDownloadingId(null);
        }
    }

    if (visibleEntries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                <span className="text-3xl">💬</span>
                <p className="mt-2 text-sm font-medium text-slate-800">
                    No activity yet
                </p>
                <p className="mt-1 text-xs text-slate-500">
                    Messages, attachments, and updates will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4">
            {error && (
                <div className="mb-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                    {error}
                </div>
            )}

            {visibleEntries.map((entry) => {
                // ── Render Comment ──────────────────────────────────
                if (entry.type === "comment") {
                    const message =
                        typeof entry.data.message === "string"
                            ? entry.data.message
                            : "";
                    const isInternal = entry.data.type === "internal";

                    const actorName = getActorName(entry.actor);
                    const isSelf =
                        entry.actor &&
                        typeof entry.actor === "object" &&
                        "email" in entry.actor &&
                        (entry.actor as { email: string }).email === user?.email;

                    return (
                        <div
                            key={entry.id}
                            className={`flex flex-col ${
                                isSelf ? "items-end" : "items-start"
                            }`}
                        >
                            <div className="mb-1 flex items-center gap-2 px-1 text-xs text-slate-500">
                                <span className="font-semibold text-slate-700">
                                    {actorName}
                                </span>
                                {isInternal && (
                                    <Badge variant="warning">
                                        🔒 Internal Note
                                    </Badge>
                                )}
                                <span>·</span>
                                <span>{formatDateTime(entry.createdAt)}</span>
                            </div>

                            <div
                                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-xs whitespace-pre-wrap leading-relaxed ${
                                    isInternal
                                        ? "border border-amber-300 bg-amber-50 text-slate-900"
                                        : isSelf
                                        ? "bg-blue-600 text-white rounded-br-none"
                                        : "border border-slate-200 bg-white text-slate-800 rounded-bl-none"
                                }`}
                            >
                                {message}
                            </div>
                        </div>
                    );
                }

                // ── Render Attachment ───────────────────────────────
                if (entry.type === "attachment") {
                    const fileName =
                        typeof entry.data.fileName === "string"
                            ? entry.data.fileName
                            : "Attachment";
                    const size =
                        typeof entry.data.size === "number"
                            ? entry.data.size
                            : 0;
                    const attachmentId =
                        typeof entry.data._id === "string"
                            ? entry.data._id
                            : typeof entry.data.id === "string"
                            ? entry.data.id
                            : entry.id;

                    const isSelf =
                        entry.actor &&
                        typeof entry.actor === "object" &&
                        "email" in entry.actor &&
                        (entry.actor as { email: string }).email === user?.email;

                    return (
                        <div
                            key={entry.id}
                            className={`flex flex-col ${
                                isSelf ? "items-end" : "items-start"
                            }`}
                        >
                            <div className="mb-1 flex items-center gap-2 px-1 text-xs text-slate-500">
                                <span className="font-semibold text-slate-700">
                                    {getActorName(entry.actor)}
                                </span>
                                <span>shared an attachment</span>
                                <span>·</span>
                                <span>{formatDateTime(entry.createdAt)}</span>
                            </div>

                            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs max-w-sm">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xl text-blue-600">
                                    📎
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-slate-900">
                                        {fileName}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {formatFileSize(size)}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    loading={downloadingId === attachmentId}
                                    disabled={downloadingId === attachmentId}
                                    onClick={() =>
                                        handleDownloadAttachment(
                                            attachmentId,
                                            fileName
                                        )
                                    }
                                >
                                    Download
                                </Button>
                            </div>
                        </div>
                    );
                }

                // ── Render System History Event ──────────────────────
                if (entry.type === "history") {
                    const action =
                        typeof entry.data.action === "string"
                            ? entry.data.action
                            : "updated ticket";
                    const oldValue =
                        typeof entry.data.oldValue === "string"
                            ? entry.data.oldValue
                            : null;
                    const newValue =
                        typeof entry.data.newValue === "string"
                            ? entry.data.newValue
                            : null;

                    return (
                        <div
                            key={entry.id}
                            className="my-2 flex justify-center"
                        >
                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                                <span className="font-medium">
                                    {getActorName(entry.actor)}
                                </span>
                                <span>{action.replaceAll("_", " ")}</span>
                                {(oldValue || newValue) && (
                                    <span className="font-mono text-slate-500">
                                        ({oldValue ?? "—"} → {newValue ?? "—"})
                                    </span>
                                )}
                                <span className="text-slate-400">·</span>
                                <span className="text-slate-400">
                                    {formatDateTime(entry.createdAt)}
                                </span>
                            </div>
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
}