import { useCallback, useEffect, useState } from "react";

import { getSlaPolicies } from "@/api/slaApi";
import type { SlaPolicy } from "@/types/sla.types";

import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import Spinner from "@/components/common/Spinner";
import Badge from "@/components/common/Badge";

import SlaModal from "@/components/admin/SlaModal";
import { getErrorMessage } from "@/utils/errorHelpers";
import { formatDurationMinutes } from "@/utils/formatters";

export default function AdminSlaPage() {
    const [policies, setPolicies] = useState<SlaPolicy[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [editingPolicy, setEditingPolicy] = useState<SlaPolicy | null>(null);

    const loadPolicies = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getSlaPolicies();
            setPolicies(data);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPolicies();
    }, [loadPolicies]);

    function handlePolicySuccess() {
        setSuccessMessage("SLA policy updated successfully.");
        loadPolicies();
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                    SLA Policies
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                    Configure response and resolution SLA target times (stored in minutes) for each ticket priority level.
                </p>
            </div>

            {successMessage && (
                <Alert variant="success">{successMessage}</Alert>
            )}

            {error && <Alert variant="error">{error}</Alert>}

            {isLoading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                    <Spinner size="lg" />
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Priority
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Response Target
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Resolution Target
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200 bg-white">
                            {policies.map((policy) => (
                                <tr key={policy.priority} className="hover:bg-slate-50">
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <Badge variant={policy.priority}>
                                            {policy.priority.toUpperCase()}
                                        </Badge>
                                    </td>

                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                                        {formatDurationMinutes(policy.responseTarget)}
                                    </td>

                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                                        {formatDurationMinutes(policy.resolutionTarget)}
                                    </td>

                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                                        {policy.isCustomized ? (
                                            <span className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                                                Customized
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                                Default
                                            </span>
                                        )}
                                    </td>

                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setEditingPolicy(policy)}
                                        >
                                            Edit Target
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* SLA Edit Modal */}
            {editingPolicy && (
                <SlaModal
                    isOpen={Boolean(editingPolicy)}
                    onClose={() => setEditingPolicy(null)}
                    onSuccess={handlePolicySuccess}
                    policy={editingPolicy}
                />
            )}
        </div>
    );
}
