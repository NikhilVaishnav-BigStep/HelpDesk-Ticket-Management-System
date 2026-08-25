export function formatDateTime(value: string | null): string {
    if (!value) {
        return "—";
    }

    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function formatDurationMinutes(minutes: number): string {
    if (!Number.isFinite(minutes) || minutes <= 0) {
        return "0 mins";
    }

    if (minutes < 60) {
        return `${minutes} min${minutes !== 1 ? "s" : ""}`;
    }

    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;

    let text = "";
    if (hours >= 24 && hours % 24 === 0 && remMinutes === 0) {
        const days = hours / 24;
        text = `${hours} hr${hours !== 1 ? "s" : ""} (${days} day${days !== 1 ? "s" : ""})`;
    } else if (remMinutes === 0) {
        text = `${hours} hr${hours !== 1 ? "s" : ""}`;
    } else {
        text = `${hours} hr${hours !== 1 ? "s" : ""} ${remMinutes} min${remMinutes !== 1 ? "s" : ""}`;
    }

    return `${text} (${minutes.toLocaleString()} mins)`;
}