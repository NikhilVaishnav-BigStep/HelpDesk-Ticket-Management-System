import "dotenv/config";
import { connectDatabase, disconnectDatabase } from "../database/connection.js";
import { logger } from "../logger/logger.js";
import { seedAll } from "./seed.js";
import {
    Category,
} from "../models/Category.js";
import {
    Comment,
} from "../models/Comment.js";
import {
    Attachment,
} from "../models/Attachment.js";
import {
    SLA,
} from "../models/SLA.js";
import {
    User,
} from "../models/User.js";
import {
    Ticket,
} from "../models/Ticket.js";
import {
    TicketHistory,
} from "../models/TicketHistory.js";

const args = process.argv.slice(2);
const reset = args.includes("--reset") || args.includes("-r");

const resetCollections = async (): Promise<void> => {
    logger.warn("Resetting all collections before seeding...");
    await Promise.all([
        User.deleteMany({}),
        SLA.deleteMany({}),
        Category.deleteMany({}),
        Ticket.deleteMany({}),
        Comment.deleteMany({}),
        TicketHistory.deleteMany({}),
        Attachment.deleteMany({}),
    ]);
};

const main = async (): Promise<void> => {
    await connectDatabase();

    if (reset) {
        await resetCollections();
    }

    await seedAll();

    await disconnectDatabase();
    process.exit(0);
};

main().catch((error) => {
    logger.error("Seed failed", error);
    process.exit(1);
});
