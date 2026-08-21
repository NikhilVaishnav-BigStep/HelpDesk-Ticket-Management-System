/**
 * OpenAPI components / schemas — single source of truth referenced from
 * every route's `@openapi` JSDoc block.
 *
 * Keep this file in sync with the actual Mongoose models. Names are
 * referenced as `#/components/schemas/<Name>`.
 */

export const openApiComponents = {
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },
        schemas: {
            Error: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string" },
                    errors: { type: "object", additionalProperties: true },
                },
                required: ["success", "message"],
            },
            SuccessEnvelope: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: {},
                },
                required: ["success", "message"],
            },
            Pagination: {
                type: "object",
                properties: {
                    page: { type: "integer", example: 1 },
                    limit: { type: "integer", example: 10 },
                    total: { type: "integer", example: 0 },
                    totalPages: { type: "integer", example: 0 },
                },
                required: ["page", "limit", "total", "totalPages"],
            },
            User: {
                type: "object",
                properties: {
                    _id: { type: "string" },
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    role: {
                        type: "string",
                        enum: ["customer", "agent", "admin"],
                    },
                    teamId: { type: "string", nullable: true },
                    deleted: { type: "boolean" },
                    deletedAt: {
                        type: "string",
                        format: "date-time",
                        nullable: true,
                    },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            Ticket: {
                type: "object",
                properties: {
                    _id: { type: "string" },
                    customerId: { type: "string" },
                    assigneeId: { type: "string", nullable: true },
                    categoryId: { type: "string", nullable: true },
                    priority: {
                        type: "string",
                        enum: ["low", "medium", "high", "urgent"],
                    },
                    status: {
                        type: "string",
                        enum: [
                            "open",
                            "assigned",
                            "in_progress",
                            "resolved",
                            "closed",
                        ],
                    },
                    subject: { type: "string" },
                    description: { type: "string" },
                    responseDueAt: {
                        type: "string",
                        format: "date-time",
                        nullable: true,
                    },
                    resolutionDueAt: {
                        type: "string",
                        format: "date-time",
                        nullable: true,
                    },
                    respondedAt: {
                        type: "string",
                        format: "date-time",
                        nullable: true,
                    },
                    resolvedAt: {
                        type: "string",
                        format: "date-time",
                        nullable: true,
                    },
                    closedAt: {
                        type: "string",
                        format: "date-time",
                        nullable: true,
                    },
                    breached: { type: "boolean" },
                    reopenedAt: {
                        type: "string",
                        format: "date-time",
                        nullable: true,
                    },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            Comment: {
                type: "object",
                properties: {
                    _id: { type: "string" },
                    ticketId: { type: "string" },
                    authorId: { type: "string" },
                    type: {
                        type: "string",
                        enum: ["external", "internal"],
                    },
                    message: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            Attachment: {
                type: "object",
                properties: {
                    _id: { type: "string" },
                    ticketId: { type: "string" },
                    uploadedBy: { type: "string" },
                    fileName: { type: "string" },
                    storageKey: { type: "string" },
                    mimeType: { type: "string" },
                    size: { type: "integer" },
                    createdAt: { type: "string", format: "date-time" },
                },
            },
            TicketHistory: {
                type: "object",
                properties: {
                    _id: { type: "string" },
                    ticketId: { type: "string" },
                    actorId: { type: "string" },
                    action: {
                        type: "string",
                        enum: [
                            "status_change",
                            "assign",
                            "priority_change",
                            "comment",
                            "reopen",
                            "close",
                            "sla_breach",
                            "other",
                        ],
                    },
                    oldValue: { type: "string", nullable: true },
                    newValue: { type: "string", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                },
            },
            Category: {
                type: "object",
                properties: {
                    _id: { type: "string" },
                    name: { type: "string" },
                    status: {
                        type: "string",
                        enum: ["active", "inactive"],
                    },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            SlaPolicy: {
                type: "object",
                properties: {
                    priority: {
                        type: "string",
                        enum: ["low", "medium", "high", "urgent"],
                    },
                    responseTarget: { type: "integer" },
                    resolutionTarget: { type: "integer" },
                    isCustomized: { type: "boolean" },
                },
            },
            TicketReport: {
                type: "object",
                properties: {
                    summary: {
                        type: "object",
                        properties: {
                            totalTickets: { type: "integer" },
                            openTickets: { type: "integer" },
                            assignedTickets: { type: "integer" },
                            inProgressTickets: { type: "integer" },
                            resolvedTickets: { type: "integer" },
                            closedTickets: { type: "integer" },
                            breachedTickets: { type: "integer" },
                            breachRate: { type: "number" },
                        },
                    },
                    performance: {
                        type: "object",
                        properties: {
                            avgResponseTimeMinutes: { type: "number" },
                            avgResolutionTimeMinutes: { type: "number" },
                        },
                    },
                    byPriority: { type: "object", additionalProperties: true },
                    byStatus: { type: "object", additionalProperties: true },
                    byCategory: {
                        type: "array",
                        items: { type: "object", additionalProperties: true },
                    },
                },
            },
            BulkResult: {
                type: "object",
                properties: {
                    requested: { type: "integer" },
                    succeeded: { type: "integer" },
                    failed: { type: "integer" },
                    results: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                ticketId: { type: "string" },
                                success: { type: "boolean" },
                                ticket: {
                                    $ref: "#/components/schemas/Ticket",
                                },
                                error: {
                                    type: "object",
                                    properties: {
                                        code: { type: "integer" },
                                        message: { type: "string" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            TimelineEntry: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    type: {
                        type: "string",
                        enum: ["comment", "history", "attachment"],
                    },
                    createdAt: { type: "string", format: "date-time" },
                    actor: {
                        type: "object",
                        nullable: true,
                        properties: {
                            id: { type: "string" },
                            name: { type: "string" },
                            role: { type: "string" },
                        },
                    },
                    data: { type: "object", additionalProperties: true },
                },
            },
            TicketTimeline: {
                type: "object",
                properties: {
                    ticket: { type: "object", additionalProperties: true },
                    timeline: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/TimelineEntry",
                        },
                    },
                    counts: {
                        type: "object",
                        properties: {
                            comments: { type: "integer" },
                            history: { type: "integer" },
                            attachments: { type: "integer" },
                        },
                    },
                },
            },
        },
    },
} as const;
