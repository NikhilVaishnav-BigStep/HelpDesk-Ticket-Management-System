import { useEffect, type ReactNode } from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    footer,
    className = "",
}: ModalProps) {
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    const handleBackdropClick = (
        event: React.MouseEvent<HTMLDivElement>,
    ) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
            onMouseDown={handleBackdropClick}
            role="presentation"
        >
            <div
                className={`w-full max-w-lg rounded-xl bg-white shadow-xl ${className}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <h2
                        id="modal-title"
                        className="text-lg font-semibold text-slate-900"
                    >
                        {title}
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Close modal"
                    >
                        <span className="text-xl leading-none">&times;</span>
                    </button>
                </div>

                <div className="px-5 py-4">{children}</div>

                {footer && (
                    <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}