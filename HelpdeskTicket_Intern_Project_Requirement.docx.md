**PROJECT 4 — HELPDESK / TICKET MANAGEMENT SYSTEM**

*Internship Full-Stack Project Requirement • Difficulty: Medium to High*

Version: 1.0 | 17 August 2026

# **1\. Project Definition**

Build a customer support platform where customers create tickets and support agents manage assignment, priority, SLA, comments and resolution.

# **2\. Project Goals**

* Build the complete solution from database design to deployed frontend.  
* Create secure, documented and testable REST APIs.  
* Implement real business rules rather than simple CRUD-only screens.  
* Demonstrate frontend-to-backend integration and proper error handling.

# **3\. User Roles**

* Customer — create tickets, communicate with support and provide feedback.  
* Agent — manage assigned tickets, comments, priority and resolution.  
* Admin — manage users, teams, categories, SLA policies and reports.

# **4\. Functional Requirements**

* Authentication and RBAC  
* Ticket creation/management  
* Assignment  
* Priority and status  
* Comments and internal notes  
* Attachments  
* SLA tracking  
* Notifications  
* Audit history  
* Reports

# **5\. Business Logic & Edge Cases**

* Ticket lifecycle: Open → Assigned → In Progress → Resolved → Closed with controlled transitions.  
* Only authorized agents/supervisors can change internal fields.  
* Priority determines SLA target.  
* System calculates response/resolution due times and breach status.  
* Customer comments are external; internal notes are restricted to support staff.  
* Closed tickets require a reopen flow before further updates.  
* All important changes are recorded in ticket history.  
* Ticket lists support filtering by status, priority, assignee, category and date.

# **6\. Database Requirements**

| Entity | Fields / Relationships |
| :---- | :---- |
| User | id, name, email, role, teamId |
| Ticket | id, customerId, assigneeId, categoryId, priority, status, subject, description |
| Comment | ticketId, authorId, type, message |
| Attachment | ticketId, uploadedBy, fileName, storageKey |
| SLA | priority, responseTarget, resolutionTarget |
| TicketHistory | ticketId, actorId, action, oldValue, newValue, createdAt |
| Category | id, name, status |

# **7\. REST API Requirements**

| Method | Endpoint | Purpose | Access |
| :---- | :---- | :---- | :---- |
| POST | /api/v1/tickets | Create ticket | Customer |
| GET | /api/v1/tickets | Search/filter tickets | Authorized |
| GET | /api/v1/tickets/:id | Get ticket details | Authorized |
| PUT | /api/v1/tickets/:id | Update ticket | Agent/Admin |
| PUT | /api/v1/tickets/:id/assign | Assign ticket | Agent/Admin |
| PUT | /api/v1/tickets/:id/status | Change status | Agent/Admin |
| POST | /api/v1/tickets/:id/comments | Add comment | Authorized |
| GET | /api/v1/tickets/:id/history | Get audit history | Agent/Admin |
| POST | /api/v1/tickets/:id/attachments | Upload attachment | Authorized |
| GET | /api/v1/reports/tickets | Ticket metrics | Admin |

All APIs should use /api/v1 versioning, consistent HTTP status codes, request validation, authentication where required, and a standard success/error response format.

# **8\. Frontend Requirements**

* Customer dashboard  
* Create ticket  
* Ticket detail/timeline  
* Agent queue  
* Search/filter  
* Ticket assignment  
* Internal notes  
* Admin configuration  
* SLA dashboard  
* Reports

# **9\. Medium-to-High Complexity Requirements**

* Implement SLA timers and breach detection.  
* Maintain complete ticket audit history.  
* Add file upload using local or S3-style storage abstraction.  
* Add notification-service abstraction.  
* Dashboard should show open tickets, SLA breaches and average resolution time.  
* Optional: real-time ticket updates using Socket.IO.

# **10\. Non-Functional Requirements**

* Use a modular/layered backend structure: routes → controllers → services → repositories/models.  
* Do not place business logic directly inside route handlers.  
* Use centralized error handling and separate application/error logs.  
* Protect secrets using environment variables; never commit credentials.  
* Implement loading, empty, validation and server-error states in the frontend.  
* Use pagination for potentially large list APIs.  
* Apply authentication and authorization at API level, not only in the UI.  
* Add indexes for frequently searched/filterable database fields where appropriate.

# **11\. API Documentation & Testing**

* Swagger/OpenAPI must describe every implemented endpoint, request body, query parameters, authentication and response.  
* Postman collection must demonstrate the main user journeys.  
* Unit tests must cover important business calculations/rules.  
* Integration/API tests must cover authentication, authorization, validation and major CRUD/workflow APIs.  
* Document sample test users and seed data.

# **12\. Definition of Done**

* Database schema is implemented and sample data is available.  
* Frontend and backend run independently using documented environment configuration.  
* All major requirements and business rules are implemented.  
* Authentication and role-based authorization work correctly.  
* Validation and centralized error handling are implemented.  
* Frontend consumes real backend APIs; no hard-coded business data.  
* Swagger and Postman documentation are complete.  
* Automated tests pass.  
* README contains architecture, setup, API, database and deployment instructions.  
* Application is deployed or has a reproducible deployment procedure.

# **13\. Deliverables**

* Frontend source code  
* Backend source code  
* Database schema/ER diagram  
* Architecture diagram  
* Swagger/OpenAPI documentation  
* Postman collection  
* Unit and integration/API tests  
* Seed/sample data  
* .env.example  
* README with setup and deployment instructions  
* Demo/presentation covering architecture and key business flows

# **14\. Evaluation Criteria**

| Area | Weight |
| :---- | :---- |
| Frontend implementation | 15% |
| Backend/API implementation | 25% |
| Database design | 10% |
| Business logic and edge cases | 15% |
| Authentication/security | 10% |
| Testing | 10% |
| Swagger/documentation | 5% |
| Code quality/Git/deployment | 10% |

# **15\. Recommended Technology Stack**

| Area | Recommended Technology |
| :---- | :---- |
| Frontend | React.js \+ TypeScript \+ React Router \+ Axios/Fetch |
| Backend | Node.js \+ Express.js \+ TypeScript |
| Database | MongoDB/Mongoose OR PostgreSQL/Prisma |
| Authentication | JWT \+ password hashing |
| Authorization | Role-based access control |
| Validation | Zod/Joi or equivalent |
| Documentation | Swagger/OpenAPI \+ Postman |
| Testing | Jest \+ Supertest or equivalent |
| Quality | ESLint \+ Prettier \+ environment variables |
| DevOps | Git/GitHub; Docker and CI/CD recommended |
| Deployment | Frontend \+ backend \+ database deployment |

# **16\. Suggested Development Phases**

| Phase | Activities | Output |
| :---- | :---- | :---- |
| 1\. Analysis | Requirements, actors, use cases, edge cases | User stories \+ requirement notes |
| 2\. Design | ER diagram, API contract, architecture | DB schema \+ API specification |
| 3\. Backend Foundation | Express, config, DB, auth, logging | Running backend |
| 4\. Core APIs | CRUD, validation, business logic | Testable REST APIs |
| 5\. Frontend | Screens, forms, routing, API integration | Working UI |
| 6\. Advanced Logic | Workflow, calculations, roles, reports | Business-complete application |
| 7\. Quality | Swagger, Postman, tests, linting | QA-ready application |
| 8\. Deployment | Build, environment, deployment | Live app \+ README |

# **17\. Final Intern Assessment**

The intern should be able to explain the complete flow from user action → React UI → REST API → validation/authentication → business service → database → response → UI. The final assessment should focus on correctness of business rules, security, API quality, code organization, testing and ability to explain design decisions.