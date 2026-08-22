interface PaginationProps {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
    onPageChange: (page: number) => void;
    onLimitChange?: (limit: number) => void;
    limitOptions?: number[];
}

export default function Pagination({
    page,
    totalPages,
    total,
    limit,
    onPageChange,
    onLimitChange,
    limitOptions = [10, 20, 50],
}: PaginationProps) {
    const canGoPrevious = page > 1;
    const canGoNext = page < totalPages;

    return (
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-500">
                {total === 0
                    ? "No results"
                    : `Page ${page} of ${totalPages} · ${total} total`}
            </div>

            <div className="flex items-center gap-3">
                {onLimitChange && (
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                        <span>Rows</span>

                        <select
                            value={limit}
                            onChange={(event) =>
                                onLimitChange(Number(event.target.value))
                            }
                            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            {limitOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                <button
                    type="button"
                    disabled={!canGoPrevious}
                    onClick={() => onPageChange(page - 1)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Previous
                </button>

                <button
                    type="button"
                    disabled={!canGoNext}
                    onClick={() => onPageChange(page + 1)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
}