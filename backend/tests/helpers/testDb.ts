import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// Ensure all models are registered in mongoose for population & lifecycle
import "../../src/models/User.js";
import "../../src/models/Ticket.js";
import "../../src/models/Category.js";
import "../../src/models/SLA.js";
import "../../src/models/Comment.js";
import "../../src/models/Attachment.js";
import "../../src/models/TicketHistory.js";

let mongo: MongoMemoryServer | null = null;

export const connectTestDb = async (): Promise<void> => {
    if (mongo) {
        return;
    }
    mongo = await MongoMemoryServer.create({
        binary: { version: "7.0.14" },
    });
    const uri = mongo.getUri();
    await mongoose.connect(uri);
};

export const disconnectTestDb = async (): Promise<void> => {
    await mongoose.disconnect();
    if (mongo) {
        await mongo.stop();
        mongo = null;
    }
};

export const clearTestDb = async (): Promise<void> => {
    const collections = mongoose.connection.collections;
    for (const key of Object.keys(collections)) {
        await collections[key].deleteMany({});
    }
};
