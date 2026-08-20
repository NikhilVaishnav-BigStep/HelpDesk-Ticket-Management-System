import { createTicketHistory } from "../repositories/ticketHistory.repository.js";
import type { ITicketHistory } from "../models/TicketHistory.js";

export type TicketHistoryAction = ITicketHistory["action"];

export const recordTicketHistory = async ({
    ticketId,
    actorId,
    action,
    oldValue,
    newValue,
}: {
    ticketId: string;
    actorId: string;
    action: TicketHistoryAction;
    oldValue?: string | null;
    newValue?: string | null;
}) => {
    return createTicketHistory({
        ticketId,
        actorId,
        action,
        oldValue: oldValue ?? null,
        newValue: newValue ?? null,
    });
};