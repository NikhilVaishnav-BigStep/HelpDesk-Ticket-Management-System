import "dotenv/config";

const requiredEnv = (key: string): string => {
    const value = process.env[key];

    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }

    return value;
};

export const env = {
    port: Number(process.env.PORT) || 5000,
    mongoUri: requiredEnv("MONGO_URI"),
    JWT_SECRET: requiredEnv("JWT_SECRET"),
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "1d",
};