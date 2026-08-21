import type { Priority } from "./ticket.types";

export interface SlaPolicy {
    priority: Priority;
    responseTarget: number;
    resolutionTarget: number;
    isCustomized: boolean;
}