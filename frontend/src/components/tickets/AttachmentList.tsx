import { useState } from "react";
import type { ChangeEvent } from "react";
import {
    downloadAttachment,
    uploadAttachment,
} from "@/api/attachmentApi";
import Button from "@/components/common/Button";
import Alert from "@/components/common/Alert";
import type { Attachment } from "@/types/ticket.types";

interface AttachmentListProps {
    ticketId: string;
    attachments?: Attachment[];
    onAttachmentUploaded?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "text/plain",
];

function formatFileSize(size: number) {
    if (size < 1024) {
        return `${size} B`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentList({
    ticketId,
    attachments = [],
    onAttachmentUploaded,
}: AttachmentListProps) {
    const [selectedFile, setSelectedFile] =
        useState<File | null>(null);

    const [isUploading, setIsUploading] =
        useState(false);

    const [downloadingId, setDownloadingId] =
        useState<string | null>(null);

    const [error, setError] =
        useState<string | null>(null);

    const [success, setSuccess] =
        useState<string | null>(null);

    function handleFileChange(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0];

        setError(null);
        setSuccess(null);

        if (!file) {
            setSelectedFile(null);
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setError(
                "File size cannot exceed 10 MB."
            );

            event.target.value = "";
            setSelectedFile(null);
            return;
        }

        if (
            !ALLOWED_FILE_TYPES.includes(
                file.type
            )
        ) {
            setError(
                "This file type is not supported."
            );

            event.target.value = "";
            setSelectedFile(null);
            return;
        }

        setSelectedFile(file);
    }

    async function handleUpload() {
        if (!selectedFile) {
            setError("Please select a file first.");
            return;
        }

        try {
            setIsUploading(true);
            setError(null);
            setSuccess(null);

            await uploadAttachment(
                ticketId,
                selectedFile
            );

            setSelectedFile(null);
            setSuccess(
                "Attachment uploaded successfully."
            );

            onAttachmentUploaded?.();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to upload the attachment."
            );
        } finally {
            setIsUploading(false);
        }
    }

    async function handleDownload(
        attachment: Attachment
    ) {
        try {
            setDownloadingId(attachment._id);
            setError(null);

            const blob =
                await downloadAttachment(
                    attachment._id
                );

            const url =
                window.URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            link.href = url;
            link.download = attachment.fileName;

            document.body.appendChild(link);
            link.click();

            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to download the attachment."
            );
        } finally {
            setDownloadingId(null);
        }
    }

    return (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
                <h3 className="text-base font-semibold text-slate-900">
                    Attachments
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                    Upload supporting files for this ticket.
                </p>
            </div>

            {error && (
                <Alert variant="error">
                    {error}
                </Alert>
            )}

            {success && (
                <Alert variant="success">
                    {success}
                </Alert>
            )}

            <div className="rounded-lg border border-dashed border-slate-300 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                        type="file"
                        onChange={handleFileChange}
                        disabled={isUploading}
                        className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                    />

                    <Button
                        type="button"
                        variant="primary"
                        disabled={
                            !selectedFile ||
                            isUploading
                        }
                        loading={isUploading}
                        onClick={handleUpload}
                    >
                        Upload
                    </Button>
                </div>

                {selectedFile && (
                    <p className="mt-3 text-sm text-slate-600">
                        Selected:{" "}
                        <span className="font-medium">
                            {selectedFile.name}
                        </span>{" "}
                        ({formatFileSize(
                            selectedFile.size
                        )})
                    </p>
                )}

                <p className="mt-2 text-xs text-slate-500">
                    Maximum size: 10 MB. Supported:
                    JPEG, PNG, WebP, PDF and TXT.
                </p>
            </div>

            {attachments.length === 0 ? (
                <div className="rounded-lg bg-slate-50 p-5 text-center">
                    <p className="text-sm text-slate-500">
                        No attachments yet.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {attachments.map((attachment) => (
                        <div
                            key={attachment._id}
                            className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg">
                                📎
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-slate-900">
                                    {attachment.fileName}
                                </p>

                                <p className="text-xs text-slate-500">
                                    {attachment.mimeType} ·{" "}
                                    {formatFileSize(
                                        attachment.size
                                    )}
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={
                                    downloadingId ===
                                    attachment._id
                                }
                                loading={
                                    downloadingId ===
                                    attachment._id
                                }
                                onClick={() =>
                                    handleDownload(
                                        attachment
                                    )
                                }
                            >
                                Download
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}