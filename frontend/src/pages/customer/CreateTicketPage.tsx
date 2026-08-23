import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createTicket } from "@/api/ticketApi";
import { getCategories } from "@/api/categoryApi";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import Textarea from "@/components/common/Textarea";
import Alert from "@/components/common/Alert";
import Spinner from "@/components/common/Spinner";

import type { Category } from "@/types/category.types";
import type { Priority } from "@/types/ticket.types";
import { getErrorMessage } from "@/utils/errorHelpers";

interface FormData {
    subject: string;
    description: string;
    priority: Priority;
    categoryId: string;
}

interface FormErrors {
    subject?: string;
    description?: string;
    categoryId?: string;
    general?: string;
}

const initialFormData: FormData = {
    subject: "",
    description: "",
    priority: "medium",
    categoryId: "",
};

const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
];

export default function CreateTicketPage() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [categories, setCategories] = useState<Category[]>([]);

    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [errors, setErrors] = useState<FormErrors>({});

    useEffect(() => {
        async function loadCategories() {
            try {
                const data = await getCategories("active");
                setCategories(data);
            } catch (error) {
                setErrors({
                    general: getErrorMessage(error),
                });
            } finally {
                setIsLoadingCategories(false);
            }
        }

        loadCategories();
    }, []);

    function handleChange(
        event: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) {
        const { name, value } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: value,
        }));

        setErrors((current) => ({
            ...current,
            [name]: undefined,
            general: undefined,
        }));
    }

    function validate(): boolean {
        const newErrors: FormErrors = {};

        if (!formData.subject.trim()) {
            newErrors.subject = "Subject is required.";
        } else if (formData.subject.trim().length > 200) {
            newErrors.subject = "Subject must be 200 characters or less.";
        }

        if (!formData.description.trim()) {
            newErrors.description = "Description is required.";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!validate()) {
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        try {
            const ticket = await createTicket({
                subject: formData.subject.trim(),
                description: formData.description.trim(),
                priority: formData.priority,
                categoryId: formData.categoryId || undefined,
            });

            navigate(`/tickets/${ticket._id}`);
        } catch (error) {
            setErrors({
                general: getErrorMessage(error),
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="mx-auto max-w-3xl">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-slate-900">
                    Create Ticket
                </h1>

                <p className="mt-1 text-sm text-slate-600">
                    Tell us about the issue you need help with.
                </p>
            </div>

            {errors.general && (
                <div className="mb-5">
                    <Alert variant="error">{errors.general}</Alert>
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
                <div className="space-y-5">
                    <Input
                        id="ticket-subject"
                        label="Subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Briefly describe your issue"
                        maxLength={200}
                        error={errors.subject}
                        required
                    />

                    <Textarea
                        id="ticket-description"
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Describe your issue in detail..."
                        rows={7}
                        error={errors.description}
                        required
                    />

                    <Select
                        id="ticket-priority"
                        label="Priority"
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                    >
                        {priorityOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>

                    {isLoadingCategories ? (
                        <div className="flex items-center gap-2 py-2 text-sm text-slate-600">
                            <Spinner size="sm" />
                            Loading categories...
                        </div>
                    ) : (
                        <Select
                            id="ticket-category"
                            label="Category"
                            name="categoryId"
                            value={formData.categoryId}
                            onChange={handleChange}
                            error={errors.categoryId}
                        >
                            <option value="">Select a category</option>
                            {categories.map((category) => (
                                <option key={category._id} value={category._id}>
                                    {category.name}
                                </option>
                            ))}
                        </Select>
                    )}
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/customer")}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        variant="primary"
                        loading={isSubmitting}
                        disabled={isSubmitting}
                    >
                        Create Ticket
                    </Button>
                </div>
            </form>
        </div>
    );
}