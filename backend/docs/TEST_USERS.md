# Test Users & Seed Data

This document lists the credentials of the seeded users created by
`npm run seed` (or `npm run seed:reset`) along with the demo data they own.
Use these accounts for local development, manual API testing, and the
Postman collection.

> **Production reminder:** these are demo accounts. Rotate or remove them
> before any non-local deployment.

## Seed scripts

| Script | Behaviour |
| --- | --- |
| `npm run seed` | Inserts/updates SLAs, categories, and users (idempotent). Wipes tickets/comments/history/attachments and re-creates them so demo tickets are always fresh. |
| `npm run seed:reset` | Same as `npm run seed` but also wipes users/SLAs/categories first. Use for a fully clean database. |

Both scripts load `.env` for `MONGO_URI`.

## Seeded users

All passwords follow the pattern `<Role>@1234`. Passwords are hashed with
bcrypt (12 salt rounds) before storage.

| Role | Email | Password | Name | Team |
| --- | --- | --- | --- | --- |
| admin | `admin@helpdesk.local` | `Admin@1234` | Ada Admin | ops |
| agent | `agent.alice@helpdesk.local` | `Agent@1234` | Alice Agent | support-tier1 |
| agent | `agent.bob@helpdesk.local` | `Agent@1234` | Bob Agent | support-tier2 |
| customer | `customer.carol@helpdesk.local` | `Customer@1234` | Carol Customer | — |
| customer | `customer.dave@helpdesk.local` | `Customer@1234` | Dave Customer | — |

### Login example

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@helpdesk.local","password":"Admin@1234"}'
```

The response contains a `token` field. Send it as a Bearer token on
subsequent requests:

```bash
curl http://localhost:5000/api/v1/users \
  -H "Authorization: Bearer <token>"
```

## Role-based access summary

| Role | Can do |
| --- | --- |
| **admin** | Everything: manage users, SLA policies, categories, view all tickets, run reports, bulk operations, etc. |
| **agent** | View all tickets, assign/change status/comment/upload on any ticket, bulk operations, view SLA policies, view reports. **Cannot** manage users, categories, or SLA policies (admin only). |
| **customer** | Create their own tickets, view only their own tickets, add external comments, upload attachments, **cannot** view internal notes or ticket history. |

## Seeded SLA policies

| Priority | Response target | Resolution target |
| --- | --- | --- |
| low | 240 minutes (4 h) | 2880 minutes (48 h) |
| medium | 60 minutes (1 h) | 480 minutes (8 h) |
| high | 30 minutes | 240 minutes (4 h) |
| urgent | 15 minutes | 120 minutes (2 h) |

## Seeded categories

`Billing`, `Technical`, `Account`, `General` (all `active`).

## Seeded tickets (10)

| # | Subject | Priority | Status | Customer | Assignee | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Cannot log in to my account | high | in_progress | Carol | Alice | Has external + internal comments |
| 2 | Invoice shows wrong total | medium | assigned | Dave | Bob | Has external comments |
| 3 | Feature request: dark mode | low | open | Carol | — | |
| 4 | API returns 500 on POST /orders | urgent | resolved | Dave | Alice | Has external + internal comments |
| 5 | Refund for duplicate charge | high | closed | Dave | Bob | Has attachment metadata (`invoice.pdf`) |
| 6 | How do I change my plan? | low | open | Carol | — | |
| 7 | Mobile app crashes on startup (iOS) | urgent | in_progress | Dave | Alice | Has external + internal comments |
| 8 | Need W-9 form for accounting | medium | resolved | Carol | Bob | Has external comments |
| 9 | Old ticket for breach demo | low | resolved | Dave | Alice | Marked `breached: true` for reports testing |
| 10 | SLA breach case | high | open | Carol | Alice | Marked `breached: true` |

Tickets cover every status (`open`, `assigned`, `in_progress`, `resolved`,
`closed`) and every priority. Two tickets are flagged as breached so the
admin reports endpoint returns non-zero breach metrics out of the box.

## Suggested journeys to exercise

1. **Login as Carol** → `GET /api/v1/tickets` (only her tickets visible) →
   `GET /api/v1/tickets/:id/timeline` for ticket #1.
2. **Login as Alice** → `GET /api/v1/tickets?search=login` →
   `PUT /api/v1/tickets/:id/status` to move ticket #3 → `assigned` →
   `POST /api/v1/tickets/bulk/status` to close multiple at once.
3. **Login as Admin** → `GET /api/v1/reports/tickets` to see breach %
   populated by tickets #9 and #10 → `PUT /api/v1/sla/urgent` to change
   SLA → `GET /api/v1/users?role=agent` to list the team.
4. **Login as Bob** → `POST /api/v1/tickets/:id/comments` with
   `type: "internal"` (allowed for agents, blocked for customers).

## Resetting the database

```bash
npm run seed:reset
```

This drops all collections and re-runs the seed. Useful when iterating on
schema changes or after pulling new migrations.
