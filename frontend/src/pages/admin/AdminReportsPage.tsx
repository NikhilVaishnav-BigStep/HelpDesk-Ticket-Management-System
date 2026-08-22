import { useCallback, useEffect, useState } from "react";

import { getTicketReport } from "@/api/reportApi";
import { getCategories } from "@/api/categoryApi";

import type { TicketReport, CategoryBucket } from "@/types/report.types";
import type { Category } from "@/types/category.types";
import type { Priority, TicketStatus } from "@/types/ticket.types";

import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import Spinner from "@/components/common/Spinner";
import StatCard from "@/components/reports/StatCard";
import Badge from "@/components/common/Badge";

import { getErrorMessage } from "@/utils/errorHelpers";

function formatMinutes(minutes: number): string {
    if (!minutes || minutes === 0) return "0m";
    if (minutes < 60) return `${minutes}m`;
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export default function AdminReportsPage() {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [categoryId, setCategoryId] = useState("");

    const [categories, setCategories] = useState<Category[]>([]);
    const [report, setReport] = useState<TicketReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadCategories() {
            try {
                const list = await getCategories("active");
                setCategories(list);
            } catch {
                // Silently fallback to empty categories dropdown
            }
        }
        loadCategories();
    }, []);

    const loadReport = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const data = await getTicketReport({
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                categoryId: categoryId || undefined,
            });

            setReport(data);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, [startDate, endDate, categoryId]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);

    function handleReset() {
        setStartDate("");
        setEndDate("");
        setCategoryId("");
    }

    const hasFilters = Boolean(startDate || endDate || categoryId);

    return (
        <div className="space-y-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Reports & SLA Analytics
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Comprehensive overview of ticket volume, response performance, and SLA compliance.
                    </p>
                </div>
            </div>

            {error && <Alert variant="error">{error}</Alert>}

            {/* Filter Bar */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Input
                        id="report-start-date"
                        label="Start Date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />

                    <Input
                        id="report-end-date"
                        label="End Date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />

                    <Select
                        id="report-category"
                        label="Category"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {categories.map((c) => (
                            <option key={c._id} value={c._id}>
                                {c.name}
                            </option>
                        ))}
                    </Select>

                    <div className="flex items-end">
                        <Button
                            variant="outline"
                            onClick={handleReset}
                            disabled={!hasFilters}
                            className="w-full"
                        >
                            Reset Filters
                        </Button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                    <Spinner size="lg" />
                </div>
            ) : report ? (
                <>
                    {/* Top Stats Cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="Total Tickets"
                            value={report.summary.totalTickets}
                            description="Total tickets created in range"
                        />

                        <StatCard
                            title="SLA Breach Rate"
                            value={`${report.summary.breachRate}%`}
                            description={`${report.summary.breachedTickets} ticket(s) breached SLA`}
                        />

                        <StatCard
                            title="Avg Response Time"
                            value={report.performance.avgResponseTimeMinutes}
                            description={`Approx ${formatMinutes(
                                report.performance.avgResponseTimeMinutes
                            )}`}
                        />

                        <StatCard
                            title="Avg Resolution Time"
                            value={report.performance.avgResolutionTimeMinutes}
                            description={`Approx ${formatMinutes(
                                report.performance.avgResolutionTimeMinutes
                            )}`}
                        />
                    </div>

                    {/* Status Breakdown Grid */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Ticket Status Breakdown
                        </h2>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                            {(
                                [
                                    "open",
                                    "assigned",
                                    "in_progress",
                                    "resolved",
                                    "closed",
                                ] as TicketStatus[]
                            ).map((st) => (
                                <div
                                    key={st}
                                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                                >
                                    <Badge variant={st}>
                                        {st.replace("_", " ").toUpperCase()}
                                    </Badge>
                                    <p className="mt-2 text-2xl font-bold text-slate-900">
                                        {report.byStatus[st] ?? 0}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Priority Breakdown Table */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900">
                            SLA Performance by Priority
                        </h2>

                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Priority
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Total Tickets
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Breached Tickets
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Breach Rate
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {(
                                        [
                                            "urgent",
                                            "high",
                                            "medium",
                                            "low",
                                        ] as Priority[]
                                    ).map((p) => {
                                        const bucket = report.byPriority[p] ?? {
                                            total: 0,
                                            breached: 0,
                                            breachRate: 0,
                                        };

                                        return (
                                            <tr
                                                key={p}
                                                className="hover:bg-slate-50"
                                            >
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <Badge variant={p}>
                                                        {p.toUpperCase()}
                                                    </Badge>
                                                </td>

                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                                                    {bucket.total}
                                                </td>

                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                                    {bucket.breached > 0 ? (
                                                        <span className="font-semibold text-red-600">
                                                            {bucket.breached}
                                                        </span>
                                                    ) : (
                                                        "0"
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                                                    {bucket.breachRate}%
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Category Breakdown Table */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Ticket Volume & SLA Breaches by Category
                        </h2>

                        {report.byCategory && report.byCategory.length > 0 ? (
                            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Category
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Total Tickets
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Breached Tickets
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-200 bg-white">
                                        {report.byCategory.map((cat: CategoryBucket) => (
                                            <tr
                                                key={cat.categoryId ?? "uncategorized"}
                                                className="hover:bg-slate-50"
                                            >
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                                                    {cat.categoryName}
                                                </td>

                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                                                    {cat.total}
                                                </td>

                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                                    {cat.breached > 0 ? (
                                                        <span className="font-semibold text-red-600">
                                                            {cat.breached}
                                                        </span>
                                                    ) : (
                                                        "0"
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                                No category data found for the selected filters.
                            </div>
                        )}
                    </section>
                </>
            ) : null}
        </div>
    );
}
