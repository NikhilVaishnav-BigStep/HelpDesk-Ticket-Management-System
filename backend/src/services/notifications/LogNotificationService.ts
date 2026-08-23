import type { ITicket, TicketStatus } from "../../models/Ticket.js";
import { logger } from "../../logger/logger.js";
import { findUserById } from "../../repositories/user.repository.js";
import type {
    NotificationRecipient,
    NotificationService,
} from "./NotificationService.js";
import { getDocId } from "../../utils/entityHelpers.js";

const asRecipient = async (
    userId: string | null | undefined,
): Promise<NotificationRecipient | null> => {
    if (!userId || userId === "[object Object]") {
        return null;
    }
    const user = await findUserById(userId);
    if (!user || user.deleted) {
        return null;
    }
    return {
        userId: user._id.toString(),
        role: user.role,
        email: user.email,
        name: user.name,
    };
};

export class LogNotificationService implements NotificationService {
    private recipientsByTicket(
        ticket: ITicket,
    ): Promise<NotificationRecipient | null>[] {
        return [
            asRecipient(getDocId(ticket.customerId)),
            asRecipient(getDocId(ticket.assigneeId)),
        ];
    }

    private async log(
        type:
            | "ticket_created"
            | "ticket_assigned"
            | "ticket_status_changed"
            | "ticket_reopened",
        ticket: ITicket,
        recipients: NotificationRecipient[],
        payload: unknown,
    ): Promise<void> {
        const snapshot = {
            id: ticket._id.toString(),
            subject: ticket.subject,
            status: ticket.status,
            priority: ticket.priority,
            customerId: getDocId(ticket.customerId),
            assigneeId: getDocId(ticket.assigneeId) || null,
        };

        logger.info(
            `[notification] ${type} ticket=${snapshot.id} recipients=${recipients
                .map((r) => `${r.role}:${r.userId}`)
                .join(",") || "none"}`,
            { event: type, ticket: snapshot, recipients, payload },
        );
    }

    async notifyTicketCreated(ticket: ITicket): Promise<void> {
        const recipients = (await Promise.all(this.recipientsByTicket(ticket)))
            .filter((r): r is NotificationRecipient => r !== null);
        await this.log("ticket_created", ticket, recipients, {});
    }

    async notifyTicketAssigned(
        ticket: ITicket,
        previousAssigneeId: string | null,
        newAssigneeId: string,
    ): Promise<void> {
        const recipientSet = new Map<string, NotificationRecipient>();
        const customer = await asRecipient(getDocId(ticket.customerId));
        if (customer) {
            recipientSet.set(customer.userId, customer);
        }
        const newAssignee = await asRecipient(newAssigneeId);
        if (newAssignee) {
            recipientSet.set(newAssignee.userId, newAssignee);
        }
        const previousAssignee = await asRecipient(previousAssigneeId);
        if (previousAssignee) {
            recipientSet.set(previousAssignee.userId, previousAssignee);
        }

        await this.log(
            "ticket_assigned",
            ticket,
            Array.from(recipientSet.values()),
            { previousAssigneeId, newAssigneeId },
        );
    }

    async notifyTicketStatusChanged(
        ticket: ITicket,
        oldStatus: TicketStatus,
        newStatus: TicketStatus,
    ): Promise<void> {
        const recipients = (await Promise.all(this.recipientsByTicket(ticket)))
            .filter((r): r is NotificationRecipient => r !== null);
        await this.log(
            "ticket_status_changed",
            ticket,
            recipients,
            { oldStatus, newStatus } satisfies {
                oldStatus: TicketStatus;
                newStatus: TicketStatus;
            },
        );
    }

    async notifyTicketReopened(ticket: ITicket): Promise<void> {
        const recipients = (await Promise.all(this.recipientsByTicket(ticket)))
            .filter((r): r is NotificationRecipient => r !== null);
        await this.log("ticket_reopened", ticket, recipients, {});
    }
}
