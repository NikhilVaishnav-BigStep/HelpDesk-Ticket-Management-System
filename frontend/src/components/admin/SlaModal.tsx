import { useState } from "react";

import Modal from "@/components/common/Modal";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Alert from "@/components/common/Alert";

import { updateSlaPolicy } from "@/api/slaApi";
import type { SlaPolicy } from "@/types/sla.types";
import { getErrorMessage } from "@/utils/errorHelpers";

interface SlaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    policy: SlaPolicy;
}

export default function SlaModal({
    isOpen,
    onClose,
    onSuccess,
    policy,
}: SlaModalProps) {
    const [responseTarget, setResponseTarget] = useState(
        policy.responseTarget.toString()
    );
    const [resolutionTarget, setResolutionTarget] = useState(
        policy.resolutionTarget.toString()
    );

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleClose() {
        setError(null);
        onClose();
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const respNum = Number(responseTarget);
        const resNum = Number(resolutionTarget);

        if (isNaN(respNum) || respNum < 1) {
            setError("Response target must be a positive number.");
            return;
        }

        if (isNaN(resNum) || resNum < 1) {
            setError("Resolution target must be a positive number.");
            return;
        }

        if (resNum < respNum) {
            setError("Resolution target cannot be less than Response target.");
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            await updateSlaPolicy(policy.priority, {
                responseTarget: respNum,
                resolutionTarget: resNum,
            });

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
            title={`Configure SLA — ${policy.priority.toUpperCase()} Priority`}
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
                        Save Policy
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <Alert variant="error">{error}</Alert>}

                <Input
                    id="response-target"
                    label="Response Target (hours)"
                    type="number"
                    min={1}
                    value={responseTarget}
                    onChange={(e) => setResponseTarget(e.target.value)}
                    required
                    disabled={isSubmitting}
                />

                <Input
                    id="resolution-target"
                    label="Resolution Target (hours)"
                    type="number"
                    min={1}
                    value={resolutionTarget}
                    onChange={(e) => setResolutionTarget(e.target.value)}
                    required
                    disabled={isSubmitting}
                />
            </form>
        </Modal>
    );
}
