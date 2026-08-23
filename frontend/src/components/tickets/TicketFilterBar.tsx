import { useEffect, useState } from "react";

import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import Button from "@/components/common/Button";

import { getCategories } from "@/api/categoryApi";

import type { Category } from "@/types/category.types";
import type { TicketStatus, Priority } from "@/types/ticket.types";

export interface TicketFilters {
    search: string;
    status: TicketStatus | "";
    priority: Priority | "";
    categoryId: string;
    startDate: string;
    endDate: string;
}

interface TicketFilterBarProps {
    filters: TicketFilters;
    onFiltersChange: (filters: TicketFilters) => void;
}

const EMPTY_FILTERS: TicketFilters = {
    search: "",
    status: "",
    priority: "",
    categoryId: "",
    startDate: "",
    endDate: "",
};

export default function TicketFilterBar({
    filters,
    onFiltersChange,
}: TicketFilterBarProps) {
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        async function loadCategories() {
            try {
                const data = await getCategories("active");
                setCategories(data);
            } catch {
                // Silently fail — the category dropdown will just be empty
            }
        }

        loadCategories();
    }, []);

    function handleChange(
        field: keyof TicketFilters,
        value: string
    ) {
        onFiltersChange({ ...filters, [field]: value });
    }

    function handleReset() {
        onFiltersChange(EMPTY_FILTERS);
    }

    const hasActiveFilters = Object.values(filters).some(
        (value) => value !== ""
    );

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
                {/* Search */}
                <div className="md:col-span-2">
                    <Input
                        id="ticket-search"
                        placeholder="Search by subject..."
                        value={filters.search}
                        onChange={(e) =>
                            handleChange("search", e.target.value)
                        }
                    />
                </div>

                {/* Status */}
                <Select
                    id="ticket-status-filter"
                    value={filters.status}
                    onChange={(e) =>
                        handleChange("status", e.target.value)
                    }
                >
                    <option value="">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                </Select>

                {/* Priority */}
                <Select
                    id="ticket-priority-filter"
                    value={filters.priority}
                    onChange={(e) =>
                        handleChange("priority", e.target.value)
                    }
                >
                    <option value="">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                </Select>

                {/* Category */}
                <Select
                    id="ticket-category-filter"
                    value={filters.categoryId}
                    onChange={(e) =>
                        handleChange("categoryId", e.target.value)
                    }
                >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                            {cat.name}
                        </option>
                    ))}
                </Select>

                {/* Reset */}
                <div className="flex items-end">
                    <Button
                        variant="outline"
                        size="md"
                        onClick={handleReset}
                        disabled={!hasActiveFilters}
                        className="w-full"
                    >
                        Reset Filters
                    </Button>
                </div>
            </div>

            {/* Date range row */}
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Input
                    id="ticket-start-date"
                    label="Start Date"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                        handleChange("startDate", e.target.value)
                    }
                />

                <Input
                    id="ticket-end-date"
                    label="End Date"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                        handleChange("endDate", e.target.value)
                    }
                />
            </div>
        </div>
    );
}
