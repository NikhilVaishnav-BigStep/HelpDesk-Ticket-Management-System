import { useRef, useState } from "react";
import type { FormEvent, ChangeEvent } from "react";

import { addComment } from "@/api/commentApi";
import { uploadAttachment } from "@/api/attachmentApi";
import { useAuth } from "@/hooks/useAuth";
import Alert from "@/components/common/Alert";
import Spinner from "@/components/common/Spinner";
import type { CommentType } from "@/types/ticket.types";

interface ChatInputBarProps {
    ticketId: string;
    isClosed?: boolean;
    onActivityAdded?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "text/plain",
];

export default function ChatInputBar({
    ticketId,
    isClosed = false,
    onActivityAdded,
}: ChatInputBarProps) {
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const isSupportStaff =
        user?.role === "agent" || user?.role === "admin";

    const [message, setMessage] = useState("");
    const [isInternal, setIsInternal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleFileClick() {
        if (isClosed || isSubmitting) return;
        fileInputRef.current?.click();
    }

    function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        setError(null);

        if (!file) {
            setSelectedFile(null);
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setError("File size cannot exceed 10 MB.");
            e.target.value = "";
            setSelectedFile(null);
            return;
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            setError("Supported files: JPEG, PNG, WebP, PDF, TXT.");
            e.target.value = "";
            setSelectedFile(null);
            return;
        }

        setSelectedFile(file);
    }

    function handleRemoveFile() {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();

        const trimmed = message.trim();
        if (!trimmed && !selectedFile) {
            setError("Please enter a message or select a file.");
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            // 1. Upload attachment if selected
            if (selectedFile) {
                await uploadAttachment(ticketId, selectedFile);
            }

            // 2. Post comment if text entered
            if (trimmed) {
                const commentType: CommentType =
                    isSupportStaff && isInternal ? "internal" : "external";

                await addComment(ticketId, {
                    message: trimmed,
                    type: commentType,
                });
            }

            // Reset input
            setMessage("");
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            onActivityAdded?.();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to send message."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isClosed) {
        return (
            <div className="rounded-b-xl border-t border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                This ticket is closed. Reopen the ticket to send messages.
            </div>
        );
    }

    return (
        <div className="sticky bottom-0 z-20 rounded-b-xl border-t border-slate-200 bg-white p-3 shadow-lg">
            {error && (
                <div className="mb-2">
                    <Alert variant="error">{error}</Alert>
                </div>
            )}

            {/* Support Staff Mode Toggle */}
            {isSupportStaff && (
                <div className="mb-2 flex items-center justify-between px-1">
                    <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 text-xs">
                        <button
                            type="button"
                            onClick={() => setIsInternal(false)}
                            className={`rounded-md px-2.5 py-1 font-medium transition ${
                                !isInternal
                                    ? "bg-white text-blue-600 shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            Public Reply
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsInternal(true)}
                            className={`rounded-md px-2.5 py-1 font-medium transition ${
                                isInternal
                                    ? "bg-amber-500 text-white shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            🔒 Internal Note
                        </button>
                    </div>

                    {isInternal && (
                        <span className="text-xs text-amber-700 font-medium">
                            Internal note visible to support staff only
                        </span>
                    )}
                </div>
            )}

            {/* Selected File Attachment Preview Pill */}
            {selectedFile && (
                <div className="mb-2 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-800">
                    <div className="flex items-center gap-2 truncate">
                        <span>📎</span>
                        <span className="truncate font-medium">
                            {selectedFile.name}
                        </span>
                        <span className="text-blue-600">
                            ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="ml-2 font-bold text-blue-600 hover:text-blue-800"
                        title="Remove attachment"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Chat Input Bar Form */}
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
                {/* Hidden File Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isSubmitting}
                />

                {/* Paperclip Attachment Icon Button */}
                <button
                    type="button"
                    onClick={handleFileClick}
                    disabled={isSubmitting}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    title="Attach a file"
                    aria-label="Attach a file"
                >
                    <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                    </svg>
                </button>

                {/* Message Input Box */}
                <div className="flex-1">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        placeholder={
                            isInternal
                                ? "Write an internal note for staff..."
                                : "Type a message..."
                        }
                        rows={1}
                        className={`w-full resize-none rounded-2xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                            isInternal
                                ? "border-amber-300 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-200"
                                : "border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-100"
                        }`}
                        disabled={isSubmitting}
                    />
                </div>

                {/* Send Button */}
                <button
                    type="submit"
                    disabled={isSubmitting || (!message.trim() && !selectedFile)}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40 ${
                        isInternal
                            ? "bg-amber-500 hover:bg-amber-600 focus:ring-amber-400"
                            : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                    }`}
                    title="Send message"
                    aria-label="Send message"
                >
                    {isSubmitting ? (
                        <Spinner size="sm" />
                    ) : (
                        <svg
                            className="h-5 w-5 translate-x-0.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                        </svg>
                    )}
                </button>
            </form>
        </div>
    );
}
