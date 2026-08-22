import { useCallback, useEffect, useState } from "react";

import { getTickets } from "@/api/ticketApi";
import type { GetTicketsParams, PaginatedTickets } from "@/api/ticketApi";

import { useDebounce } from "@/hooks/useDebounce";
import { useSocket } from "@/hooks/useSocket";

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
    const { socket } = useSocket();

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

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
        setSelectedIds(new Set());
    }, [
        debouncedSearch,
        filters.status,
        filters.priority,
        filters.categoryId,
        filters.startDate,
        filters.endDate,
    ]);

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                    Ticket Queue
                </h1>

                <p className="mt-1 text-sm text-slate-600">
                    Manage and process support tickets.
                </p>
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