import { useState } from "react";
import type { FormEvent } from "react";
import { addComment } from "@/api/commentApi";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/common/Button";
import Alert from "@/components/common/Alert";
import Textarea from "@/components/common/Textarea";
import type { CommentType } from "@/types/ticket.types";

interface CommentBoxProps {
    ticketId: string;
    onCommentAdded?: () => void;
}

export default function CommentBox({
    ticketId,
    onCommentAdded,
}: CommentBoxProps) {
    const { user } = useAuth();

    const isSupportStaff =
        user?.role === "agent" || user?.role === "admin";

    const [message, setMessage] = useState("");
    const [isInternal, setIsInternal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedMessage = message.trim();

        if (!trimmedMessage) {
            setError("Comment cannot be empty.");
            return;
        }

        if (trimmedMessage.length > 5000) {
            setError("Comment cannot exceed 5000 characters.");
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            const type: CommentType =
                isSupportStaff && isInternal
                    ? "internal"
                    : "external";

            await addComment(ticketId, {
                message: trimmedMessage,
                type,
            });

            setMessage("");
            setIsInternal(false);

            onCommentAdded?.();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to add the comment."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
            <div>
                <h3 className="text-base font-semibold text-slate-900">
                    Add a comment
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                    {isSupportStaff
                        ? "Reply to the customer or add an internal note."
                        : "Send a message to the support team."}
                </p>
            </div>

            {error && (
                <Alert variant="error">
                    {error}
                </Alert>
            )}

            <Textarea
                label="Message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={
                    isInternal
                        ? "Add an internal note..."
                        : "Write your message..."
                }
                rows={5}
                maxLength={5000}
                disabled={isSubmitting}
            />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {isSupportStaff && (
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={isInternal}
                            onChange={(event) =>
                                setIsInternal(event.target.checked)
                            }
                            disabled={isSubmitting}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />

                        <span>
                            Internal Note
                        </span>

                        <span className="text-xs text-slate-500">
                            (visible to support staff only)
                        </span>
                    </label>
                )}

                <Button
                    type="submit"
                    variant="primary"
                    disabled={
                        isSubmitting ||
                        !message.trim()
                    }
                    loading={isSubmitting}
                >
                    {isInternal
                        ? "Add Internal Note"
                        : "Send Comment"}
                </Button>
            </div>
        </form>
    );
}