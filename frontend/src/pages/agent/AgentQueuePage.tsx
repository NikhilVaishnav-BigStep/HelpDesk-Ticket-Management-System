import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { getTickets } from "@/api/ticketApi";
import type { GetTicketsParams, PaginatedTickets } from "@/api/ticketApi";

import { useDebounce } from "@/hooks/useDebounce";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/hooks/useAuth";

import Alert from "@/components/common/Alert";
import Spinner from "@/components/common/Spinner";
import Pagination from "@/components/common/Pagination";

import TicketFilterBar from "@/components/tickets/TicketFilterBar";
import type { TicketFilters } from "@/components/tickets/TicketFilterBar";
import TicketTable from "@/components/tickets/TicketTable";
import BulkActionBar from "@/components/tickets/BulkActionBar";

const INITIAL_FILTERS: TicketFilters = {
    search: "",
    status: "",
    priority: "",
    categoryId: "",
    startDate: "",
    endDate: "",
};

export default function AgentQueuePage() {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [searchParams, setSearchParams] = useSearchParams();

    const isAgent = user?.role === "agent";
    const isAdmin = user?.role === "admin";

    // Default scope for agent is 'assigned', for admin is 'all'
    const scopeParam = searchParams.get("scope");
    const scope = scopeParam || (isAgent ? "assigned" : "all");

    const [filters, setFilters] = useState<TicketFilters>(INITIAL_FILTERS);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [data, setData] = useState<PaginatedTickets | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const debouncedSearch = useDebounce(filters.search, 400);

    const loadTickets = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const params: GetTicketsParams = {
                page,
                limit,
                sortBy: "createdAt",
                order: "desc",
            };

            const currentUserId = user?._id || user?.id || "";

            if (isAgent) {
                if (scope === "unassigned") {
                    params.assigneeId = "unassigned";
                } else {
                    params.assigneeId = currentUserId;
                }
            }

            if (debouncedSearch) params.search = debouncedSearch;
            if (filters.status) params.status = filters.status;
            if (filters.priority) params.priority = filters.priority;
            if (filters.categoryId) params.categoryId = filters.categoryId;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;

            const result = await getTickets(params);
            setData(result);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load tickets."
            );
        } finally {
            setIsLoading(false);
        }
    }, [
        page,
        limit,
        scope,
        isAgent,
        user?._id,
        debouncedSearch,
        filters.status,
        filters.priority,
        filters.categoryId,
        filters.startDate,
        filters.endDate,
    ]);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    // Live Socket.IO queue updates
    useEffect(() => {
        const handleQueueUpdated = () => {
            loadTickets();
        };

        socket.on("queue_updated", handleQueueUpdated);

        return () => {
            socket.off("queue_updated", handleQueueUpdated);
        };
    }, [loadTickets, socket]);

    // Reset to page 1 when scope or filters change
    useEffect(() => {
        setPage(1);
        setSelectedIds(new Set());
    }, [
        scope,
        debouncedSearch,
        filters.status,
        filters.priority,
        filters.categoryId,
        filters.startDate,
        filters.endDate,
    ]);

    function handleTabChange(newScope: string) {
        setSearchParams({ scope: newScope });
    }

    function handlePageChange(newPage: number) {
        setPage(newPage);
        setSelectedIds(new Set());
    }

    function handleLimitChange(newLimit: number) {
        setLimit(newLimit);
        setPage(1);
        setSelectedIds(new Set());
    }

    function handleBulkActionComplete() {
        setSelectedIds(new Set());
        loadTickets();
    }

    const title = isAdmin
        ? "All Support Tickets"
        : scope === "unassigned"
        ? "Unassigned Tickets"
        : "My Assigned Tickets";

    const subtitle = isAdmin
        ? "Complete overview of all system tickets for administration."
        : scope === "unassigned"
        ? "Open support tickets awaiting an agent assignment."
        : "Tickets currently assigned to you for resolution.";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">
                        {title}
                    </h1>

                    <p className="mt-1 text-sm text-slate-600">
                        {subtitle}
                    </p>
                </div>

                {/* Queue Scope Switcher Tabs ONLY for Agent role */}
                {isAgent && (
                    <div className="inline-flex rounded-xl bg-slate-100 p-1 text-sm font-medium text-slate-600">
                        <button
                            type="button"
                            onClick={() => handleTabChange("assigned")}
                            className={`rounded-lg px-3 py-1.5 transition ${
                                scope === "assigned"
                                    ? "bg-white text-slate-900 shadow-xs"
                                    : "hover:text-slate-900"
                            }`}
                        >
                            My Assigned
                        </button>

                        <button
                            type="button"
                            onClick={() => handleTabChange("unassigned")}
                            className={`rounded-lg px-3 py-1.5 transition ${
                                scope === "unassigned"
                                    ? "bg-white text-slate-900 shadow-xs"
                                    : "hover:text-slate-900"
                            }`}
                        >
                            Unassigned
                        </button>
                    </div>
                )}
            </div>

            {/* Error banner */}
            {error && (
                <Alert variant="error">{error}</Alert>
            )}

            {/* Filters */}
            <TicketFilterBar
                filters={filters}
                onFiltersChange={setFilters}
            />

            {/* Bulk action bar */}
            {selectedIds.size > 0 && (
                <BulkActionBar
                    selectedIds={selectedIds}
                    onClearSelection={() => setSelectedIds(new Set())}
                    onActionComplete={handleBulkActionComplete}
                />
            )}

            {/* Loading */}
            {isLoading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                    <Spinner size="lg" />
                </div>
            ) : (
                <>
                    {/* Table */}
                    <TicketTable
                        tickets={data?.tickets ?? []}
                        variant="agent"
                        selectable
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                    />

                    {/* Pagination */}
                    {data && data.totalPages > 0 && (
                        <Pagination
                            page={data.page}
                            totalPages={data.totalPages}
                            total={data.total}
                            limit={data.limit}
                            onPageChange={handlePageChange}
                            onLimitChange={handleLimitChange}
                        />
                    )}
                </>
            )}
        </div>
    );
}