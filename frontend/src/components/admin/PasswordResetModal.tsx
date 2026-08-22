import { useState } from "react";

import Modal from "@/components/common/Modal";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Alert from "@/components/common/Alert";

import { resetUserPassword } from "@/api/userApi";
import { getErrorMessage } from "@/utils/errorHelpers";

interface PasswordResetModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
}

export default function PasswordResetModal({
    isOpen,
    onClose,
    userId,
    userName,
}: PasswordResetModalProps) {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    function resetForm() {
        setNewPassword("");
        setConfirmPassword("");
        setError(null);
        setSuccess(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            await resetUserPassword(userId, newPassword);
            setSuccess(true);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleClose() {
        resetForm();
        onClose();
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Reset Password"
            footer={
                success ? (
                    <Button variant="primary" onClick={handleClose}>
                        Done
                    </Button>
                ) : (
                    <>
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            loading={isSubmitting}
                            disabled={
                                !newPassword || !confirmPassword
                            }
                        >
                            Reset Password
                        </Button>
                    </>
                )
            }
        >
            <div className="space-y-4">
                {error && <Alert variant="error">{error}</Alert>}

                {success ? (
                    <Alert variant="success">
                        Password for <strong>{userName}</strong> has been
                        reset successfully.
                    </Alert>
                ) : (
                    <>
                        <p className="text-sm text-slate-600">
                            Set a new password for{" "}
                            <strong>{userName}</strong>.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                id="reset-new-password"
                                label="New Password"
                                type="password"
                                value={newPassword}
                                onChange={(e) =>
                                    setNewPassword(e.target.value)
                                }
                                placeholder="Minimum 8 characters"
                                required
                                minLength={8}
                                disabled={isSubmitting}
                            />

                            <Input
                                id="reset-confirm-password"
                                label="Confirm Password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                placeholder="Re-enter password"
                                required
                                disabled={isSubmitting}
                            />
                        </form>
                    </>
                )}
            </div>
        </Modal>
    );
}
