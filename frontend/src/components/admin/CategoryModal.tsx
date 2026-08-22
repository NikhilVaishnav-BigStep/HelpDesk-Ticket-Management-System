import { useState } from "react";

import Modal from "@/components/common/Modal";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import Button from "@/components/common/Button";
import Alert from "@/components/common/Alert";

import { createCategory, updateCategory } from "@/api/categoryApi";
import type { Category, CategoryStatus } from "@/types/category.types";
import { getErrorMessage } from "@/utils/errorHelpers";

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    category: Category | null;
}

export default function CategoryModal({
    isOpen,
    onClose,
    onSuccess,
    category,
}: CategoryModalProps) {
    const isEditing = category !== null;

    const [name, setName] = useState(category?.name ?? "");
    const [status, setStatus] = useState<CategoryStatus>(
        category?.status ?? "active"
    );

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleClose() {
        setName(category?.name ?? "");
        setStatus(category?.status ?? "active");
        setError(null);
        onClose();
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!name.trim()) {
            setError("Category name is required.");
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            if (isEditing) {
                await updateCategory(category._id, {
                    name: name.trim(),
                    status,
                });
            } else {
                await createCategory({
                    name: name.trim(),
                    status,
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

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={isEditing ? "Edit Category" : "Create Category"}
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
                        {isEditing ? "Save Changes" : "Create Category"}
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <Alert variant="error">{error}</Alert>}

                <Input
                    id="category-name"
                    label="Category Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Technical Support, Billing"
                    required
                    disabled={isSubmitting}
                />

                <Select
                    id="category-status"
                    label="Status"
                    value={status}
                    onChange={(e) =>
                        setStatus(e.target.value as CategoryStatus)
                    }
                    disabled={isSubmitting}
                >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </Select>
            </form>
        </Modal>
    );
}
