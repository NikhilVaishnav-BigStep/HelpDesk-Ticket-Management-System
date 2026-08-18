type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

const log = (level: LogLevel, message: string, ...args: unknown[]) => {
    const timestamp = new Date().toLocaleString();

    console.log(`[${timestamp}] [${level}] ${message}`, ...args);
};

export const logger = {
    info: (message: string, ...args: unknown[]) =>
        log("INFO", message, ...args),

    warn: (message: string, ...args: unknown[]) =>
        log("WARN", message, ...args),

    error: (message: string, ...args: unknown[]) =>
        log("ERROR", message, ...args),

    debug: (message: string, ...args: unknown[]) =>
        log("DEBUG", message, ...args),
};