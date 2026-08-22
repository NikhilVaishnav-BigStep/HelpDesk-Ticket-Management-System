import { useEffect, useState } from "react";

import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import Select from "@/components/common/Select";
import Alert from "@/components/common/Alert";

import { bulkAssignTickets, bulkChangeStatus } from "@/api/ticketApi";
import { getUsers } from "@/api/userApi";

import type { User } from "@/types/user.types";
import type { TicketStatus } from "@/types/ticket.types";
import { getErrorMessage } from "@/utils/errorHelpers";

interface BulkActionBarProps {
    selectedIds: Set<string>;
    onClearSelection: () => void;
    onActionComplete: () => void;
}

export default function BulkActionBar({
    selectedIds,
    onClearSelection,
    onActionComplete,
}: BulkActionBarProps) {
    const count = selectedIds.size;

    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);

    const [agents, setAgents] = useState<User[]>([]);
    const [selectedAgent, setSelectedAgent] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<TicketStatus | "">("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Load agents for the assign modal
    useEffect(() => {
        if (!showAssignModal) return;

        async function loadAgents() {
            try {
                const data = await getUsers({ role: "agent", limit: 100 });
                // Also fetch admins
                const adminData = await getUsers({ role: "admin", limit: 100 });
                setAgents([...data.users, ...adminData.users]);
            } catch {
                setAgents([]);
            }
        }

        loadAgents();
    }, [showAssignModal]);

    async function handleBulkAssign() {
        if (!selectedAgent) {
            setError("Please select an agent to assign.");
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            const result = await bulkAssignTickets(
                Array.from(selectedIds),
                selectedAgent
            );

            setSuccess(
                `Successfully assigned ${result.succeeded} of ${result.requested} tickets.`
            );

            setShowAssignModal(false);
            setSelectedAgent("");
            onActionComplete();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleBulkStatus() {
        if (!selectedStatus) {
            setError("Please select a status.");
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            const result = await bulkChangeStatus(
                Array.from(selectedIds),
                selectedStatus
            );

            setSuccess(
                `Successfully updated ${result.succeeded} of ${result.requested} tickets.`
            );

            setShowStatusModal(false);
            setSelectedStatus("");
            onActionComplete();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            {/* Success banner */}
            {success && (
                <Alert variant="success">{success}</Alert>
            )}

            {/* Bar */}
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3">
                <span className="text-sm font-medium text-blue-800">
                    {count} ticket{count !== 1 ? "s" : ""} selected
                </span>

                <div className="flex items-center gap-2">
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                            setError(null);
                            setSuccess(null);
                            setShowAssignModal(true);
                        }}
                    >
                        Bulk Assign
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setError(null);
                            setSuccess(null);
                            setShowStatusModal(true);
                        }}
                    >
                        Bulk Status Change
                    </Button>

                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onClearSelection}
                    >
                        Deselect All
                    </Button>
                </div>
            </div>

            {/* Bulk Assign Modal */}
            <Modal
                isOpen={showAssignModal}
                onClose={() => {
                    setShowAssignModal(false);
                    setError(null);
                }}
                title="Bulk Assign Tickets"
                footer={
                    <>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowAssignModal(false);
                                setError(null);
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="primary"
                            onClick={handleBulkAssign}
                            loading={isSubmitting}
                            disabled={!selectedAgent}
                        >
                            Assign {count} Ticket{count !== 1 ? "s" : ""}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    {error && <Alert variant="error">{error}</Alert>}

                    <p className="text-sm text-slate-600">
                        Select an agent to assign{" "}
                        <strong>
                            {count} ticket{count !== 1 ? "s" : ""}
                        </strong>{" "}
                        to.
                    </p>

                    <Select
                        id="bulk-assign-agent"
                        label="Assign to"
                        value={selectedAgent}
                        onChange={(e) => setSelectedAgent(e.target.value)}
                    >
                        <option value="">Select an agent...</option>
                        {agents.map((agent) => (
                            <option key={agent._id} value={agent._id}>
                                {agent.name} ({agent.role})
                            </option>
                        ))}
                    </Select>
                </div>
            </Modal>

            {/* Bulk Status Change Modal */}
            <Modal
                isOpen={showStatusModal}
                onClose={() => {
                    setShowStatusModal(false);
                    setError(null);
                }}
                title="Bulk Status Change"
                footer={
                    <>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowStatusModal(false);
                                setError(null);
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="primary"
                            onClick={handleBulkStatus}
                            loading={isSubmitting}
                            disabled={!selectedStatus}
                        >
                            Update {count} Ticket{count !== 1 ? "s" : ""}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    {error && <Alert variant="error">{error}</Alert>}

                    <p className="text-sm text-slate-600">
                        Select a new status for{" "}
                        <strong>
                            {count} ticket{count !== 1 ? "s" : ""}
                        </strong>
                        .
                    </p>

                    <Select
                        id="bulk-status-select"
                        label="New Status"
                        value={selectedStatus}
                        onChange={(e) =>
                            setSelectedStatus(e.target.value as TicketStatus | "")
                        }
                    >
                        <option value="">Select a status...</option>
                        <option value="open">Open</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </Select>
                </div>
            </Modal>
        </>
    );
}
