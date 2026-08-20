import { SLA, type ISLA } from "../models/SLA.js";
import { TicketPriority } from "../models/Ticket.js";

export const findSLAByPriority = async (
    priority: TicketPriority,
): Promise<ISLA | null> => {
    return SLA.findOne({ priority }).exec();
};
