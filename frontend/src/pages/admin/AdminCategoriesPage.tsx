import { useCallback, useEffect, useState } from "react";

import { getCategories, deleteCategory } from "@/api/categoryApi";
import type { Category } from "@/types/category.types";

import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import Spinner from "@/components/common/Spinner";
import Badge from "@/components/common/Badge";
import EmptyState from "@/components/common/EmptyState";
import Modal from "@/components/common/Modal";

import CategoryModal from "@/components/admin/CategoryModal";

import { getErrorMessage } from "@/utils/errorHelpers";
import { formatDateTime } from "@/utils/formatters";

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadCategories = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getCategories();
            setCategories(data);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    function handleCreateNew() {
        setEditingCategory(null);
        setShowModal(true);
    }

    function handleEdit(category: Category) {
        setEditingCategory(category);
        setShowModal(true);
    }

    function handleModalSuccess() {
        setSuccessMessage(
            editingCategory
                ? "Category updated successfully."
                : "Category created successfully."
        );
        loadCategories();
    }

    async function handleDeleteConfirm() {
        if (!deleteTarget) return;

        try {
            setIsDeleting(true);
            setError(null);
            await deleteCategory(deleteTarget._id);
            setSuccessMessage(`Category "${deleteTarget.name}" was deleted.`);
            setDeleteTarget(null);
            loadCategories();
        } catch (err) {
            // Surfaces backend in-use error message gracefully
            setError(getErrorMessage(err));
            setDeleteTarget(null);
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Categories
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Manage ticket classification categories for support routing.
                    </p>
                </div>

                <Button variant="primary" onClick={handleCreateNew}>
                    + Create Category
                </Button>
            </div>

            {successMessage && (
                <Alert variant="success">{successMessage}</Alert>
            )}

            {error && <Alert variant="error">{error}</Alert>}

            {isLoading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                    <Spinner size="lg" />
                </div>
            ) : categories.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Status
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
                            {categories.map((category) => (
                                <tr key={category._id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                        {category.name}
                                    </td>

                                    <td className="whitespace-nowrap px-6 py-4">
                                        <Badge
                                            variant={
                                                category.status === "active"
                                                    ? "resolved"
                                                    : "default"
                                            }
                                        >
                                            {category.status.toUpperCase()}
                                        </Badge>
                                    </td>

                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                                        {formatDateTime(category.createdAt)}
                                    </td>

                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(category)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => setDeleteTarget(category)}
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
                    title="No categories found"
                    description="Create categories to help organize support tickets."
                />
            )}

            {/* Category Modal */}
            {showModal && (
                <CategoryModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleModalSuccess}
                    category={editingCategory}
                />
            )}

            {/* Delete Modal */}
            {deleteTarget && (
                <Modal
                    isOpen={Boolean(deleteTarget)}
                    onClose={() => setDeleteTarget(null)}
                    title="Delete Category"
                    footer={
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setDeleteTarget(null)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleDeleteConfirm}
                                loading={isDeleting}
                            >
                                Delete Category
                            </Button>
                        </>
                    }
                >
                    <p className="text-sm text-slate-600">
                        Are you sure you want to delete category{" "}
                        <strong>{deleteTarget.name}</strong>? Note: Categories currently assigned to tickets cannot be deleted.
                    </p>
                </Modal>
            )}
        </div>
    );
}
