import path from "path";
import { fileURLToPath } from "url";
import swaggerJsdoc from "swagger-jsdoc";
import { openApiComponents } from "./components.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect whether we are running from source (`src/`) or compiled output
// (`dist/`). In dev we are in `src/docs/...`, so routes live at `../routes/*.ts`.
// After `tsc` we are in `dist/docs/...`, so routes live at `../routes/*.js`.
const IN_DIST = __dirname.endsWith(`${path.sep}dist${path.sep}docs`);
const ROUTES_DIR = IN_DIST ? path.join(__dirname, "..", "routes") : path.join(__dirname, "..", "routes");

export const buildOpenApiSpec = (): ReturnType<typeof swaggerJsdoc> => {
    return swaggerJsdoc({
        definition: {
            openapi: "3.0.3",
            info: {
                title: "Helpdesk Ticket Management API",
                version: "1.0.0",
                description:
                    "REST API for the Helpdesk Ticket Management System. " +
                    "All endpoints under `/api/v1`. " +
                    "Authenticate via `POST /api/v1/auth/login` and send " +
                    "the returned JWT as `Authorization: Bearer <token>`.",
                contact: { name: "Backend Team" },
                license: { name: "ISC" },
            },
            servers: [
                { url: "http://localhost:5000/api/v1", description: "Local" },
            ],
            tags: [
                { name: "Auth", description: "Authentication and user creation" },
                { name: "Tickets", description: "Ticket lifecycle and queries" },
                { name: "Comments", description: "Ticket comments and internal notes" },
                { name: "Attachments", description: "Attachment upload and download" },
                { name: "History", description: "Ticket audit history" },
                { name: "Bulk", description: "Bulk operations" },
                { name: "Timeline", description: "Unified ticket timeline" },
                { name: "Categories", description: "Category CRUD (admin)" },
                { name: "SLA", description: "SLA policy management" },
                { name: "Users", description: "User management (admin)" },
                { name: "Reports", description: "Admin reports" },
                { name: "Health", description: "Health check" },
            ],
            ...openApiComponents,
            security: [{ bearerAuth: [] }],
        },
        apis: [
            path.join(ROUTES_DIR, "*.ts"),
            path.join(ROUTES_DIR, "*.js"),
        ],
    });
};
