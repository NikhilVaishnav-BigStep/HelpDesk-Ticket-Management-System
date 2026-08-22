import { useState } from "react";

import Modal from "@/components/common/Modal";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import Button from "@/components/common/Button";
import Alert from "@/components/common/Alert";

import { authApi } from "@/api/authApi";
import { updateUser } from "@/api/userApi";

import type { User } from "@/types/user.types";
import { getErrorMessage } from "@/utils/errorHelpers";

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    /** If editing, pass the user. If creating, pass null. */
    user: User | null;
}

export default function UserModal({
    isOpen,
    onClose,
    onSuccess,
    user,
}: UserModalProps) {
    const isEditing = user !== null;

    const [name, setName] = useState(user?.name ?? "");
    const [email, setEmail] = useState(user?.email ?? "");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<"agent" | "admin">(
        user?.role === "admin" ? "admin" : "agent"
    );
    const [teamId, setTeamId] = useState(user?.teamId ?? "");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset form when the modal opens with a different user
    function resetForm() {
        setName(user?.name ?? "");
        setEmail(user?.email ?? "");
        setPassword("");
        setRole(user?.role === "admin" ? "admin" : "agent");
        setTeamId(user?.teamId ?? "");
        setError(null);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        // Validation
        if (!name.trim()) {
            setError("Name is required.");
            return;
        }

        if (!isEditing) {
            if (!email.trim()) {
                setError("Email is required.");
                return;
            }
            if (!password || password.length < 8) {
                setError("Password must be at least 8 characters.");
                return;
            }
        }

        try {
            setIsSubmitting(true);
            setError(null);

            if (isEditing) {
                await updateUser(user._id, {
                    name: name.trim(),
                    role,
                    teamId: teamId.trim() || undefined,
                });
            } else {
                await authApi.adminCreateUser({
                    name: name.trim(),
                    email: email.trim(),
                    password,
                    role,
                    teamId: teamId.trim() || undefined,
                });
            }

            onSuccess();
            handleClose();
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
            title={isEditing ? "Edit User" : "Create User"}
            footer={
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
                    >
                        {isEditing ? "Save Changes" : "Create User"}
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <Alert variant="error">{error}</Alert>}

                <Input
                    id="user-name"
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    required
                    disabled={isSubmitting}
                />

                {!isEditing && (
                    <Input
                        id="user-email"
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@example.com"
                        required
                        disabled={isSubmitting}
                    />
                )}

                {!isEditing && (
                    <Input
                        id="user-password"
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        required
                        minLength={8}
                        disabled={isSubmitting}
                    />
                )}

                <Select
                    id="user-role"
                    label="Role"
                    value={role}
                    onChange={(e) =>
                        setRole(e.target.value as "agent" | "admin")
                    }
                    disabled={isSubmitting}
                >
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                </Select>

                <Input
                    id="user-team"
                    label="Team (optional)"
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    placeholder="e.g. Support, Engineering"
                    disabled={isSubmitting}
                />
            </form>
        </Modal>
    );
}
