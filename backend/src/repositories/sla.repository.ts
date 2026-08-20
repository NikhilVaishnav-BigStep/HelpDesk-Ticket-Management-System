import { SLA, type ISLA } from "../models/SLA.js";
import { TicketPriority } from "../models/Ticket.js";

export const findSLAByPriority = async (
    priority: TicketPriority,
): Promise<ISLA | null> => {
    return SLA.findOne({ priority }).exec();
};

export const findAllSLAs = async (): Promise<ISLA[]> => {
    return SLA.find({}).sort({ priority: 1 }).exec();
};

export const upsertSLA = async (
    priority: TicketPriority,
    targets: { responseTarget: number; resolutionTarget: number },
): Promise<ISLA> => {
    return SLA.findOneAndUpdate(
        { priority },
        { $set: { priority, ...targets } },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    ).exec() as Promise<ISLA>;
};
