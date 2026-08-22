import axios from "axios";

export function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data;

        if (data) {
            // Check for array of field issues from Zod/validation middleware
            if (Array.isArray(data.errors) && data.errors.length > 0) {
                const firstIssue = data.errors[0];
                if (typeof firstIssue === "string") return firstIssue;
                if (typeof firstIssue?.message === "string") return firstIssue.message;
            }

            // Check for object error mapping
            if (typeof data.errors === "object" && data.errors !== null) {
                const keys = Object.keys(data.errors);
                if (keys.length > 0) {
                    const val = data.errors[keys[0]];
                    if (typeof val === "string") return val;
                }
            }

            if (typeof data.message === "string" && data.message.trim()) {
                return data.message;
            }
        }

        return error.response?.statusText ?? "Something went wrong.";
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "Something went wrong.";
}