import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

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
