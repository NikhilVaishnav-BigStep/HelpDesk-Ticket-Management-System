import { findSLAByPriority } from "../repositories/sla.repository.js";
import { TicketPriority, type ITicket } from "../models/Ticket.js";
import { logger } from "../logger/logger.js";
import { recordTicketHistory } from "./ticketHistory.service.js";
import { updateTicketById } from "../repositories/ticket.repository.js";

export const DEFAULT_SLA_MINUTES: Record<
    TicketPriority,
    { responseTarget: number; resolutionTarget: number }
> = {
    [TicketPriority.LOW]: { responseTarget: 240, resolutionTarget: 2880 },
    [TicketPriority.MEDIUM]: { responseTarget: 60, resolutionTarget: 480 },
    [TicketPriority.HIGH]: { responseTarget: 30, resolutionTarget: 240 },
    [TicketPriority.URGENT]: { responseTarget: 15, resolutionTarget: 120 },
};

const MINUTE_MS = 60_000;

export const computeSlaDueDates = async (
    priority: TicketPriority,
    from: Date = new Date(),
): Promise<{ responseDueAt: Date; resolutionDueAt: Date }> => {
    const slaDoc = await findSLAByPriority(priority);

    let responseTarget: number;
    let resolutionTarget: number;

    if (slaDoc) {
        responseTarget = slaDoc.responseTarget ??
            (slaDoc.responseTargetHours !== undefined
                ? slaDoc.responseTargetHours * 60
                : NaN);
        resolutionTarget = slaDoc.resolutionTarget ??
            (slaDoc.resolutionTargetHours !== undefined
                ? slaDoc.resolutionTargetHours * 60
                : NaN);

        if (!Number.isFinite(responseTarget) || !Number.isFinite(resolutionTarget)) {
            const fallback = DEFAULT_SLA_MINUTES[priority];
            responseTarget = fallback.responseTarget;
            resolutionTarget = fallback.resolutionTarget;
            logger.warn(
                `Invalid SLA targets for priority '${priority}'. Falling back to defaults (${responseTarget}/${resolutionTarget} minutes).`,
            );
        }
    } else {
        const fallback = DEFAULT_SLA_MINUTES[priority];
        responseTarget = fallback.responseTarget;
        resolutionTarget = fallback.resolutionTarget;
        logger.warn(
            `No SLA configured for priority '${priority}'. Falling back to defaults (${responseTarget}/${resolutionTarget} minutes).`,
        );
    }

    return {
        responseDueAt: new Date(from.getTime() + responseTarget * MINUTE_MS),
        resolutionDueAt: new Date(
            from.getTime() + resolutionTarget * MINUTE_MS,
        ),
    };
};

export const detectAndRecordBreach = async (
    ticket: ITicket,
    actorId: string,
): Promise<ITicket> => {
    if (ticket.breached || ticket.resolvedAt || ticket.closedAt) {
        return ticket;
    }

    const now = new Date();
    const resolutionDueAt = ticket.resolutionDueAt;
    const responseDueAt = ticket.responseDueAt;

    const responseOverdue =
        responseDueAt !== undefined &&
        responseDueAt !== null &&
        now > responseDueAt &&
        !ticket.respondedAt;

    const resolutionOverdue =
        resolutionDueAt !== undefined &&
        resolutionDueAt !== null &&
        now > resolutionDueAt;

    if (!responseOverdue && !resolutionOverdue) {
        return ticket;
    }

    const updated = await updateTicketById(
        ticket._id.toString(),
        { breached: true } as Parameters<typeof updateTicketById>[1],
    );

    if (!updated) {
        return ticket;
    }

    await recordTicketHistory({
        ticketId: ticket._id.toString(),
        actorId,
        action: "sla_breach",
        oldValue: "within_sla",
        newValue: "breached",
    });

    return updated;
};
