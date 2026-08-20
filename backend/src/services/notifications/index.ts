import { LogNotificationService } from "./LogNotificationService.js";
import type { NotificationService } from "./NotificationService.js";

export const notificationService: NotificationService =
    new LogNotificationService();

export type { NotificationService };
