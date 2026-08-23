# HelpDesk Ticket Management System — Frontend Application

Modern, real-time HelpDesk web application built with **React 19**, **Vite 8**, **TypeScript**, **Tailwind CSS 4**, and **Socket.io Client**.

---

## Table of Contents

- [Features & Portal Overview](#features--portal-overview)
- [Tech Stack](#tech-stack)
- [Design System & Styling](#design-system--styling)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Installation & Local Setup](#installation--local-setup)
- [Running Development Server](#running-development-server)
- [Running Tests](#running-tests)
- [Building for Production](#building-for-production)
- [Deployment Guide](#deployment-guide)
- [Project Structure](#project-structure)

---

## Features & Portal Overview

### 1. Customer Portal
- **Dashboard**: Quick metrics on active, resolved, and open tickets.
- **Ticket Submission**: Submit new tickets with subjects, detailed descriptions, category assignment, priority selections, and file attachments.
- **Interactive Ticket View**: Live conversation feed with agent replies and downloadable attachments.

### 2. Agent Workspace
- **Scoped Queue Management**:
  - **My Assigned**: Tickets currently assigned to the logged-in agent.
  - **Unassigned Queue**: All open/unassigned tickets available to claim.
- **One-Click Actions**:
  - **"Assign to Me"**: Instantly claims an unassigned ticket.
  - **"Unassign Me"**: Returns ticket to the unassigned queue.
  - **Bulk Actions**: Batch assign to agent or batch transition statuses.
- **Real-Time Timeline**:
  - Live external messaging with customers.
  - **Yellow Internal Notes**: Distinct, highlighted support notes hidden from customer accounts.
  - Visual status and assignment change audit logs.

### 3. Admin Console
- **System-Wide Ticket Oversight**: View all tickets across all agents, departments, and priority levels.
- **Agent Assignment & Reassignment**: Assign or reassign any ticket to any active agent.
- **User Management**: Create, update roles, reset user passwords, and soft-delete accounts (with protection for the last remaining admin).
- **Category Administration**: Add, edit, or deactivate support categories with safety checks preventing deletion of active ticket categories.
- **SLA Policy Editor**: Configure dynamic response and resolution targets in minutes for Low, Medium, High, and Urgent priorities.
- **Analytics & SLA Reports**: Visual stat cards and breakdown grids for breach rates, average first response times, and category performance.

---

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler & Tooling**: Vite 8 with `@vitejs/plugin-react`
- **Styling**: Tailwind CSS 4 with custom design tokens
- **Routing**: React Router 7 (DOM)
- **Real-Time Client**: Socket.io Client (`socket.io-client`)
- **HTTP Client**: Axios with interceptors for JWT token attachment & response error normalization
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library + `@testing-library/jest-dom` + `jsdom`

---

## Design System & Styling

The frontend incorporates a modern design system:
- **Color Palette**: Slate neutrals with vibrant Indigo/Blue brand accents, Emerald green for success/resolved, Amber/Yellow for internal notes and warnings, and Rose/Red for SLA breaches.
- **Internal Note Highlighting**: Support internal notes are styled with prominent yellow background accents (`bg-amber-100/90`, `border-amber-300`, `text-amber-950`) and a `🔒 Internal Note` pill badge.
- **Typography & Components**: Standardized UI library in `src/components/common/` featuring `Button`, `Input`, `Select`, `Textarea`, `Badge`, `Alert`, `Modal`, `Pagination`, and `Spinner`.

---

## Prerequisites

- [Node.js](https://nodejs.org/) (version 20.x or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- Backend server running (default: `http://localhost:5000`)

---

## Environment Configuration

Create a `.env` file in the `frontend/` directory:

```env
# Backend API Base URL
VITE_API_URL=http://localhost:5000/api/v1

# Backend Socket.io URL
VITE_SOCKET_URL=http://localhost:5000
```

---

## Installation & Local Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## Running Development Server

Start the Vite development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

The application will be accessible at `http://localhost:5173`.

---

## Running Tests

The frontend uses **Vitest** and **React Testing Library** to execute unit and integration tests for all components, context hooks, and page workflows.

- **Run all tests once**:
  ```bash
  npm run test
  ```

- **Run tests in interactive watch mode**:
  ```bash
  npm run test:watch
  ```

### Included Test Suites (17 files, 48 tests):
- `src/tests/components/Button.test.tsx`
- `src/tests/components/Input.test.tsx`
- `src/tests/components/Select.test.tsx`
- `src/tests/components/Badge.test.tsx`
- `src/tests/components/Alert.test.tsx`
- `src/tests/components/Modal.test.tsx`
- `src/tests/components/Pagination.test.tsx`
- `src/tests/components/TicketTable.test.tsx`
- `src/tests/components/TicketTimeline.test.tsx`
- `src/tests/components/TicketFilterBar.test.tsx`
- `src/tests/context/AuthContext.test.tsx`
- `src/tests/hooks/useDebounce.test.ts`
- `src/tests/pages/LoginPage.test.tsx`
- `src/tests/pages/CustomerPages.test.tsx`
- `src/tests/pages/AgentQueuePage.test.tsx`
- `src/tests/pages/TicketDetailPage.test.tsx`
- `src/tests/pages/AdminPages.test.tsx`

---

## Building for Production

Compile TypeScript and build the optimized static production bundle:

```bash
npm run build
```

The output bundle will be generated in the `dist/` directory.

To preview the production build locally:
```bash
npm run preview
```

---

## Deployment Guide

### Option 1: Vercel / Netlify
For static SPA hosting on Vercel or Netlify, configure single-page application rewriting.

**Vercel (`vercel.json`)**:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Netlify (`_redirects` in `public/`)**:
```
/*    /index.html   200
```

### Option 2: Nginx Static Hosting
```nginx
server {
    listen 80;
    server_name helpdesk.yourdomain.com;
    root /var/www/helpdesk-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location /socket.io/ {
        proxy_pass http://localhost:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

---

## Project Structure

```
frontend/
├── src/
│   ├── api/                    # Axios API service clients (auth, tickets, categories, SLA, etc.)
│   ├── components/             # Reusable UI component library
│   │   ├── common/             # Base UI (Button, Input, Select, Modal, Alert, Badge)
│   │   ├── layout/             # Navbar, Sidebar, Page Shell layouts
│   │   ├── reports/            # Stat cards, breakdown tables, charts
│   │   └── tickets/            # TicketTable, Timeline, Filters, BulkActionBar
│   ├── context/                # Global React Contexts (AuthContext, SocketContext)
│   ├── hooks/                  # Custom hooks (useAuth, useSocket, useDebounce)
│   ├── pages/                  # Top-level view pages
│   │   ├── admin/              # Users, Categories, SLA, Reports pages
│   │   ├── agent/              # Queue Page (Assigned vs Unassigned)
│   │   ├── auth/               # Login, Register, Change Password
│   │   ├── customer/           # Customer Dashboard, Create Ticket
│   │   └── tickets/            # Real-Time Ticket Detail & Chat View
│   ├── tests/                  # Vitest & React Testing Library test suites
│   ├── types/                  # TypeScript domain models & DTOs
│   ├── utils/                  # Date formatters, error parsers, helpers
│   ├── App.tsx                 # Root router & role-based route guards
│   └── main.tsx                # App entrypoint
├── index.html
├── package.json
├── tsconfig.json
└── vitest.config.ts
```
