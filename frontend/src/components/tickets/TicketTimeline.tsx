import type { TimelineEntry } from "@/types/ticket.types";
import { useAuth } from "@/hooks/useAuth";
import Badge from "@/components/common/Badge";
import { formatDateTime } from "@/utils/formatters";

interface TicketTimelineProps {
    timeline: TimelineEntry[];
}

function getActorName(
    actor: TimelineEntry["actor"]
) {
    if (!actor) {
        return "System";
    }

    const actorRecord =
        actor as Record<string, unknown>;

    return typeof actorRecord.name === "string"
        ? actorRecord.name
        : "Unknown user";
}

function renderComment(
    entry: TimelineEntry
) {
    const message =
        typeof entry.data.message === "string"
            ? entry.data.message
            : "";

    const isInternal =
        entry.data.type === "internal";

    return (
        <div
            className={`rounded-lg border p-4 ${
                isInternal
                    ? "border-amber-200 bg-amber-50"
                    : "border-blue-200 bg-white"
            }`}
        >
            <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span>
                        {isInternal ? "🔒" : "💬"}
                    </span>

                    <span className="font-medium text-slate-900">
                        {getActorName(entry.actor)}
                    </span>

                    {isInternal && (
                        <Badge variant="warning">
                            Internal Note
                        </Badge>
                    )}
                </div>

                <span className="text-xs text-slate-500">
                    {formatDateTime(
                        entry.createdAt
                    )}
                </span>
            </div>

            <p className="whitespace-pre-wrap text-sm text-slate-700">
                {message}
            </p>
        </div>
    );
}

function renderHistory(
    entry: TimelineEntry
) {
    const action =
        typeof entry.data.action === "string"
            ? entry.data.action
            : "Ticket updated";

    const oldValue =
        typeof entry.data.oldValue === "string"
            ? entry.data.oldValue
            : null;

    const newValue =
        typeof entry.data.newValue === "string"
            ? entry.data.newValue
            : null;

    return (
        <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200">
                ↔
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-700">
                    <span className="font-medium">
                        {getActorName(entry.actor)}
                    </span>{" "}
                    {action.replaceAll("_", " ")}
                </p>

                {(oldValue || newValue) && (
                    <p className="mt-1 text-xs text-slate-500">
                        {oldValue ?? "—"} →{" "}
                        {newValue ?? "—"}
                    </p>
                )}
            </div>

            <span className="shrink-0 text-xs text-slate-400">
                {formatDateTime(
                    entry.createdAt
                )}
            </span>
        </div>
    );
}

function renderAttachment(
    entry: TimelineEntry
) {
    const fileName =
        typeof entry.data.fileName === "string"
            ? entry.data.fileName
            : "Attachment";

    return (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                📎
            </div>

            <div>
                <p className="text-sm font-medium text-slate-900">
                    {fileName}
                </p>

                <p className="text-xs text-slate-500">
                    Uploaded by{" "}
                    {getActorName(entry.actor)}
                </p>
            </div>
        </div>
    );
}

export default function TicketTimeline({
    timeline,
}: TicketTimelineProps) {
    const { user } = useAuth();

    const isSupportStaff =
        user?.role === "agent" ||
        user?.role === "admin";

    const visibleEntries =
        timeline.filter((entry) => {
            if (entry.type !== "comment") {
                return isSupportStaff;
            }

            if (
                entry.data.type === "internal"
            ) {
                return isSupportStaff;
            }

            return true;
        });

    if (visibleEntries.length === 0) {
        return (
            <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <h2 className="font-semibold text-slate-800">
                    No activity yet
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Comments, updates and attachments
                    will appear here.
                </p>
            </section>
        );
    }

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                        Activity
                    </h2>

                    <p className="text-sm text-slate-500">
                        Ticket history and communication
                    </p>
                </div>

                <span className="text-sm text-slate-500">
                    {visibleEntries.length}{" "}
                    {visibleEntries.length === 1
                        ? "entry"
                        : "entries"}
                </span>
            </div>

            <div className="space-y-3">
                {visibleEntries.map(
                    (entry) => (
                        <div key={entry.id}>
                            {entry.type ===
                                "comment" &&
                                renderComment(entry)}

                            {entry.type ===
                                "history" &&
                                renderHistory(entry)}

                            {entry.type ===
                                "attachment" &&
                                renderAttachment(entry)}
                        </div>
                    )
                )}
            </div>
        </section>
    );
}