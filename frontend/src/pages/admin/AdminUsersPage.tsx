import { useCallback, useEffect, useState } from "react";

import { getUsers, deleteUser } from "@/api/userApi";
import type { User, UserRole } from "@/types/user.types";
import type { PaginatedUsers } from "@/api/userApi";

import { useDebounce } from "@/hooks/useDebounce";

import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import Spinner from "@/components/common/Spinner";
import Pagination from "@/components/common/Pagination";
import Badge from "@/components/common/Badge";
import EmptyState from "@/components/common/EmptyState";
import Modal from "@/components/common/Modal";

import UserModal from "@/components/admin/UserModal";
import PasswordResetModal from "@/components/admin/PasswordResetModal";

import { getErrorMessage } from "@/utils/errorHelpers";
import { formatDateTime } from "@/utils/formatters";

export default function AdminUsersPage() {
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [data, setData] = useState<PaginatedUsers | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Modals state
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
    const [deleteTargetUser, setDeleteTargetUser] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const debouncedSearch = useDebounce(search, 300);

    const loadUsers = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const result = await getUsers({
                page,
                limit,
                search: debouncedSearch || undefined,
                role: roleFilter || undefined,
            });

            setData(result);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, debouncedSearch, roleFilter]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, roleFilter]);

    function handleCreateNew() {
        setEditingUser(null);
        setShowUserModal(true);
    }

    function handleEdit(user: User) {
        setEditingUser(user);
        setShowUserModal(true);
    }

    function handleModalSuccess() {
        setSuccessMessage(
            editingUser
                ? "User updated successfully."
                : "User created successfully."
        );
        loadUsers();
    }

    async function handleDeleteConfirm() {
        if (!deleteTargetUser) return;

        try {
            setIsDeleting(true);
            setError(null);
            await deleteUser(deleteTargetUser._id);
            setSuccessMessage(`User "${deleteTargetUser.name}" has been deleted.`);
            setDeleteTargetUser(null);
            loadUsers();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">
                        User Management
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Manage support staff, customers, and administrator accounts.
                    </p>
                </div>

                <Button variant="primary" onClick={handleCreateNew}>
                    + Create User
                </Button>
            </div>

            {successMessage && (
                <Alert variant="success">{successMessage}</Alert>
            )}

            {error && <Alert variant="error">{error}</Alert>}

            {/* Filter bar */}
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
                <div className="flex-1">
                    <Input
                        id="user-search"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="w-full sm:w-48">
                    <Select
                        id="role-filter"
                        value={roleFilter}
                        onChange={(e) =>
                            setRoleFilter(e.target.value as UserRole | "")
                        }
                    >
                        <option value="">All Roles</option>
                        <option value="customer">Customer</option>
                        <option value="agent">Agent</option>
                        <option value="admin">Admin</option>
                    </Select>
                </div>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                    <Spinner size="lg" />
                </div>
            ) : data && data.users.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Team
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200 bg-white">
                            {data.users.map((user) => (
                                <tr key={user._id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">
                                                {user.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {user.email}
                                            </p>
                                        </div>
                                    </td>

                                    <td className="whitespace-nowrap px-6 py-4">
                                        <Badge
                                            variant={
                                                user.role === "admin"
                                                    ? "urgent"
                                                    : user.role === "agent"
                                                    ? "assigned"
                                                    : "default"
                                            }
                                        >
                                            {user.role.toUpperCase()}
                                        </Badge>
                                    </td>

                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                        {user.teamId || "—"}
                                    </td>

                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                                        {formatDateTime(user.createdAt)}
                                    </td>

                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(user)}
                                            >
                                                Edit
                                            </Button>

                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() =>
                                                    setResetTargetUser(user)
                                                }
                                            >
                                                Reset Password
                                            </Button>

                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() =>
                                                    setDeleteTargetUser(user)
                                                }
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState
                    title="No users found"
                    description="No accounts match your current search/filter."
                />
            )}

            {/* Pagination */}
            {data && data.totalPages > 0 && (
                <Pagination
                    page={data.page}
                    totalPages={data.totalPages}
                    total={data.total}
                    limit={data.limit}
                    onPageChange={setPage}
                    onLimitChange={(l) => {
                        setLimit(l);
                        setPage(1);
                    }}
                />
            )}

            {/* Create/Edit User Modal */}
            {showUserModal && (
                <UserModal
                    isOpen={showUserModal}
                    onClose={() => setShowUserModal(false)}
                    onSuccess={handleModalSuccess}
                    user={editingUser}
                />
            )}

            {/* Password Reset Modal */}
            {resetTargetUser && (
                <PasswordResetModal
                    isOpen={Boolean(resetTargetUser)}
                    onClose={() => setResetTargetUser(null)}
                    userId={resetTargetUser._id}
                    userName={resetTargetUser.name}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteTargetUser && (
                <Modal
                    isOpen={Boolean(deleteTargetUser)}
                    onClose={() => setDeleteTargetUser(null)}
                    title="Confirm Delete User"
                    footer={
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setDeleteTargetUser(null)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleDeleteConfirm}
                                loading={isDeleting}
                            >
                                Delete User
                            </Button>
                        </>
                    }
                >
                    <p className="text-sm text-slate-600">
                        Are you sure you want to delete user{" "}
                        <strong>{deleteTargetUser.name}</strong> ({deleteTargetUser.email})?
                        This will soft-delete the user account.
                    </p>
                </Modal>
            )}
        </div>
    );
}
