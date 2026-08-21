import request from "supertest";
import app from "../../src/app.js";
import {
    connectTestDb,
    disconnectTestDb,
    clearTestDb,
} from "../helpers/testDb.js";

beforeAll(async () => {
    await connectTestDb();
});

afterAll(async () => {
    await disconnectTestDb();
});

beforeEach(async () => {
    await clearTestDb();
});

describe("OpenAPI documentation", () => {
    it("GET /api/docs.json returns a valid OpenAPI 3.0.3 document", async () => {
        const res = await request(app).get("/api/docs.json");

        expect(res.status).toBe(200);
        expect(res.body.openapi).toBe("3.0.3");
        expect(res.body.info.title).toBe(
            "Helpdesk Ticket Management API",
        );
        expect(Array.isArray(res.body.servers)).toBe(true);
        expect(res.body.servers[0].url).toBe(
            "http://localhost:5000/api/v1",
        );
    });

    it("documents security schemes (bearerAuth)", async () => {
        const res = await request(app).get("/api/docs.json");
        expect(res.body.components.securitySchemes.bearerAuth).toMatchObject({
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
        });
    });

    it("documents the main route prefixes", async () => {
        const res = await request(app).get("/api/docs.json");
        const paths = Object.keys(res.body.paths);

        // Auth
        expect(paths).toEqual(expect.arrayContaining([
            "/auth/register",
            "/auth/login",
            "/auth/users",
        ]));
        // Tickets
        expect(paths).toEqual(expect.arrayContaining([
            "/tickets",
            "/tickets/{id}",
            "/tickets/{id}/timeline",
            "/tickets/{id}/comments",
            "/tickets/{id}/history",
            "/tickets/{id}/attachments",
            "/tickets/{id}/assign",
            "/tickets/{id}/status",
            "/tickets/{id}/reopen",
        ]));
        // Bulk
        expect(paths).toEqual(expect.arrayContaining([
            "/tickets/bulk/assign",
            "/tickets/bulk/status",
        ]));
        // SLA / Categories / Users / Reports / Attachments / Health
        expect(paths).toEqual(expect.arrayContaining([
            "/sla",
            "/sla/{priority}",
            "/categories",
            "/categories/{id}",
            "/users",
            "/users/{id}",
            "/reports/tickets",
            "/attachments/{id}",
            "/attachments/{id}/download",
            "/health",
        ]));
    });

    it("documents expected schemas", async () => {
        const res = await request(app).get("/api/docs.json");
        const schemas = Object.keys(res.body.components.schemas);

        expect(schemas).toEqual(expect.arrayContaining([
            "Ticket",
            "Comment",
            "Attachment",
            "User",
            "TicketHistory",
            "Category",
            "SlaPolicy",
            "TicketReport",
            "BulkResult",
            "TicketTimeline",
            "SuccessEnvelope",
            "Error",
        ]));
    });

    it("every documented path has at least one operation with responses", async () => {
        const res = await request(app).get("/api/docs.json");
        for (const [path, item] of Object.entries(res.body.paths)) {
            // The /health endpoint is intentionally auth-free and only ever
            // returns 200; skip the error-coverage assertion for it.
            const isHealth = path.startsWith("/health");
            const methods = Object.keys(item as object).filter((k) =>
                [
                    "get",
                    "post",
                    "put",
                    "patch",
                    "delete",
                ].includes(k),
            );
            expect(methods.length).toBeGreaterThan(0);
            for (const m of methods) {
                const op = (item as Record<string, unknown>)[m] as {
                    responses?: Record<string, unknown>;
                };
                expect(op.responses).toBeDefined();
                const responseKeys = Object.keys(op.responses ?? {});
                expect(responseKeys.length).toBeGreaterThan(0);
                const hasSuccess = responseKeys.some((k) =>
                    /^2\d\d$/.test(k),
                );
                expect(hasSuccess).toBe(true);
                if (isHealth) {
                    continue;
                }
                const hasError = responseKeys.some((k) =>
                    /^4\d\d$/.test(k),
                );
                if (!hasError) {
                    // Helpful diagnostic if a future endpoint forgets error codes.
                    // eslint-disable-next-line no-console
                    console.warn(
                        `Missing 4xx in ${m.toUpperCase()} ${path}: ${responseKeys.join(",")}`,
                    );
                }
                expect(hasError).toBe(true);
            }
            void path;
        }
    });

    it("GET /api/docs serves the Swagger UI HTML", async () => {
        const res = await request(app).get("/api/docs/");
        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toMatch(/html/);
        expect(res.text).toMatch(/swagger/i);
    });
});
