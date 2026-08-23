import { Types } from "mongoose";
import type { UserRole } from "../models/User.js";
import { findTicketById } from "../repositories/ticket.repository.js";
import { findCommentsByTicketId } from "../repositories/comment.repository.js";
import { findHistoryByTicketId } from "../repositories/ticketHistory.repository.js";
import { findAttachmentsByTicketId } from "../repositories/attachment.repository.js";
import { User } from "../models/User.js";
import { AppException } from "../exceptions/AppException.js";
import { getDocId } from "../utils/entityHelpers.js";

interface ActorSummary {
    id: string;
    name: string;
    role: UserRole;
}

export interface TicketSnapshot {
    id: string;
    subject: string;
    status: string;
    priority: string;
    customer: ActorSummary | null;
    assignee: ActorSummary | null;
    createdAt: Date;
    updatedAt: Date;
    breached: boolean | undefined;
    responseDueAt: Date | undefined;
    resolutionDueAt: Date | undefined;
}

export type TimelineEntryType = "comment" | "history" | "attachment";

interface BaseTimelineEntry {
    id: string;
    type: TimelineEntryType;
    createdAt: Date;
    actor: ActorSummary | null;
}

interface CommentTimelineEntry extends BaseTimelineEntry {
    type: "comment";
    data: { message: string; commentType: "external" | "internal"; type: "external" | "internal" };
}

interface HistoryTimelineEntry extends BaseTimelineEntry {
    type: "history";
    data: {
        action: string;
        oldValue: string | null;
        newValue: string | null;
    };
}

interface AttachmentTimelineEntry extends BaseTimelineEntry {
    type: "attachment";
    data: {
        fileName: string;
        mimeType: string;
        size: number;
        downloadUrl: string;
    };
}

export type TimelineEntry =
    | CommentTimelineEntry
    | HistoryTimelineEntry
    | AttachmentTimelineEntry;

export interface TicketTimeline {
    ticket: TicketSnapshot;
    timeline: TimelineEntry[];
    counts: {
        comments: number;
        history: number;
        attachments: number;
    };
}

const buildActor = (
    id: string,
    lookup: Map<string, ActorSummary>,
): ActorSummary | null => lookup.get(id) ?? null;

const toActorMap = (users: Array<{
    _id: Types.ObjectId;
    name: string;
    role: UserRole;
}>): Map<string, ActorSummary> => {
    const map = new Map<string, ActorSummary>();
    for (const u of users) {
        map.set(u._id.toString(), {
            id: u._id.toString(),
            name: u.name,
            role: u.role,
        });
    }
    return map;
};

export const getTicketTimeline = async (
    ticketId: string,
    userId: string,
    role: UserRole,
): Promise<TicketTimeline> => {
    if (!Types.ObjectId.isValid(ticketId)) {
        throw new AppException("Invalid ticket id", 400);
    }

    const ticket = await findTicketById(ticketId);
    if (!ticket) {
        throw new AppException("Ticket not found", 404);
    }

    const customerIdStr = getDocId(ticket.customerId);
    const assigneeIdStr = getDocId(ticket.assigneeId);

    if (role === "customer" && customerIdStr !== userId) {
        throw new AppException(
            "You are not authorized to view this ticket",
            403,
        );
    }

    if (role === "agent" && assigneeIdStr && assigneeIdStr !== userId) {
        throw new AppException(
            "You are not authorized to view this ticket",
            403,
        );
    }

    const ticketObjectId = new Types.ObjectId(ticketId);

    const includeHistory = role !== "customer";
    const commentFilter = role === "customer" ? "external" : undefined;

    const [comments, history, attachments] = await Promise.all([
        findCommentsByTicketId(ticketObjectId, commentFilter),
        includeHistory
            ? findHistoryByTicketId(ticketObjectId)
            : Promise.resolve([]),
        findAttachmentsByTicketId(ticketObjectId),
    ]);

    const actorIds = new Set<string>();
    if (customerIdStr) actorIds.add(customerIdStr);
    if (assigneeIdStr) actorIds.add(assigneeIdStr);

    for (const c of comments) {
        actorIds.add(getDocId(c.authorId));
    }
    if (includeHistory) {
        for (const h of history) {
            actorIds.add(getDocId(h.actorId));
        }
    }
    for (const a of attachments) {
        actorIds.add(getDocId(a.uploadedBy));
    }

    const validObjectIds = Array.from(actorIds)
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));

    const actorDocs = await User.find({
        _id: { $in: validObjectIds },
    })
        .select("_id name role")
        .lean()
        .exec();

    const actorMap = toActorMap(
        actorDocs as unknown as Array<{
            _id: Types.ObjectId;
            name: string;
            role: UserRole;
        }>,
    );

    const entries: TimelineEntry[] = [];

    for (const c of comments) {
        entries.push({
            id: c._id.toString(),
            type: "comment",
            createdAt: c.createdAt,
            actor: buildActor(getDocId(c.authorId), actorMap),
            data: { message: c.message, commentType: c.type, type: c.type },
        });
    }

    for (const h of history) {
        entries.push({
            id: h._id.toString(),
            type: "history",
            createdAt: h.createdAt,
            actor: buildActor(getDocId(h.actorId), actorMap),
            data: {
                action: h.action,
                oldValue: h.oldValue,
                newValue: h.newValue,
            },
        });
    }

    for (const a of attachments) {
        entries.push({
            id: a._id.toString(),
            type: "attachment",
            createdAt: a.createdAt,
            actor: buildActor(getDocId(a.uploadedBy), actorMap),
            data: {
                fileName: a.fileName,
                mimeType: a.mimeType,
                size: a.size,
                downloadUrl: `/api/v1/attachments/${a._id.toString()}/download`,
            },
        });
    }

    entries.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    const snapshot: TicketSnapshot = {
        id: ticket._id.toString(),
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        customer: buildActor(customerIdStr, actorMap),
        assignee: assigneeIdStr ? buildActor(assigneeIdStr, actorMap) : null,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        breached: ticket.breached,
        responseDueAt: ticket.responseDueAt,
        resolutionDueAt: ticket.resolutionDueAt,
    };

    return {
        ticket: snapshot,
        timeline: entries,
        counts: {
            comments: comments.length,
            history: history.length,
            attachments: attachments.length,
        },
    };
};
