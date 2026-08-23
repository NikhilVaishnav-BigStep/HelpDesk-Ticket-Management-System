import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TicketDetailPage from "@/pages/tickets/TicketDetailPage";
import { AuthContext } from "@/context/AuthContext";
import * as ticketApi from "@/api/ticketApi";
import * as timelineApi from "@/api/timelineApi";
import * as userApi from "@/api/userApi";
import type { User } from "@/types/user.types";

const mockAgent: User = {
  _id: "agent123",
  id: "agent123",
  name: "Alice Agent",
  email: "agent.alice@helpdesk.local",
  role: "agent",
  teamId: "tier1",
  deleted: false,
  deletedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("TicketDetailPage component", () => {
  beforeEach(() => {
    vi.spyOn(timelineApi, "getTicketTimeline").mockResolvedValue({
      ticket: {
        _id: "t123",
        subject: "Unassigned Test Ticket",
        description: "Needs triage",
        status: "open",
        priority: "medium",
        customerId: { _id: "c1", name: "Carol", email: "carol@example.com", role: "customer" },
        assigneeId: null,
        categoryId: "cat1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        breached: false,
        responseDueAt: null,
        resolutionDueAt: null,
      },
      timeline: [],
      counts: { comments: 0, history: 0, attachments: 0 },
    });

    vi.spyOn(userApi, "getUsers").mockResolvedValue({
      users: [mockAgent],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it("shows 'Assign to Me' button on unassigned ticket for agent", async () => {
    vi.spyOn(ticketApi, "getTicketById").mockResolvedValue({
      _id: "t123",
      subject: "Unassigned Test Ticket",
      description: "Needs triage",
      priority: "medium",
      status: "open",
      customerId: { _id: "c1", name: "Carol", email: "carol@example.com" },
      assigneeId: null,
      categoryId: "cat1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      breached: false,
    });

    render(
      <MemoryRouter initialEntries={["/tickets/t123"]}>
        <AuthContext.Provider
          value={{
            user: mockAgent,
            token: "tok",
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
            refreshUser: vi.fn(),
          }}
        >
          <Routes>
            <Route path="/tickets/:id" element={<TicketDetailPage />} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /assign to me/i })).toBeInTheDocument();
    });
  });

  it("shows 'Unassign Me' button when ticket is assigned to the current agent", async () => {
    vi.spyOn(ticketApi, "getTicketById").mockResolvedValue({
      _id: "t123",
      subject: "Assigned Test Ticket",
      description: "Needs resolution",
      priority: "medium",
      status: "assigned",
      customerId: { _id: "c1", name: "Carol", email: "carol@example.com" },
      assigneeId: { _id: "agent123", name: "Alice Agent", email: "alice@example.com" },
      categoryId: "cat1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      breached: false,
    });

    render(
      <MemoryRouter initialEntries={["/tickets/t123"]}>
        <AuthContext.Provider
          value={{
            user: mockAgent,
            token: "tok",
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
            refreshUser: vi.fn(),
          }}
        >
          <Routes>
            <Route path="/tickets/:id" element={<TicketDetailPage />} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("✓ Assigned to You")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /unassign me/i })).toBeInTheDocument();
    });
  });
});
