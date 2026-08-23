import { useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { authApi } from "@/api/authApi";
import { getRoleLabel } from "@/utils/constants";
import { getErrorMessage } from "@/utils/errorHelpers";

import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Badge from "@/components/common/Badge";

export default function ProfilePage() {
    const { user } = useAuth();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!currentPassword) {
            setError("Current password is required.");
            return;
        }

        if (newPassword.length < 8) {
            setError("New password must be at least 8 characters.");
            return;
        }

        if (newPassword === currentPassword) {
            setError("New password must be different from current password.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);
            setSuccessMessage(null);

            await authApi.changePassword({
                currentPassword,
                newPassword,
            });

            setSuccessMessage("Your password has been changed successfully.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    }

    if (!user) return null;

    return (
        <div className="mx-auto max-w-4xl space-y-8">
            <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                    Account Profile
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                    View your profile details and manage your security settings.
                </p>
            </div>

            {/* Profile Overview Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-slate-900">
                    User Details
                </h2>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                            Full Name
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                            {user.name}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                            Email Address
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                            {user.email}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                            Role
                        </p>
                        <div className="mt-1">
                            <Badge
                                variant={
                                    user.role === "admin"
                                        ? "urgent"
                                        : user.role === "agent"
                                        ? "assigned"
                                        : "default"
                                }
                            >
                                {getRoleLabel(user.role)}
                            </Badge>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                            Team
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                            {user.teamId || "—"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Change Password Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                    Change Password
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Update your password regularly to keep your account secure.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
                    {successMessage && (
                        <Alert variant="success">{successMessage}</Alert>
                    )}

                    {error && <Alert variant="error">{error}</Alert>}

                    <Input
                        id="current-password"
                        label="Current Password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                        disabled={isSubmitting}
                    />

                    <Input
                        id="new-password"
                        label="New Password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        required
                        minLength={8}
                        disabled={isSubmitting}
                    />

                    <Input
                        id="confirm-password"
                        label="Confirm New Password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        required
                        disabled={isSubmitting}
                    />

                    <div className="pt-2">
                        <Button
                            type="submit"
                            variant="primary"
                            loading={isSubmitting}
                            disabled={
                                !currentPassword ||
                                !newPassword ||
                                !confirmPassword
                            }
                        >
                            Update Password
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}