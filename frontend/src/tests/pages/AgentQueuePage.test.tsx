import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AgentQueuePage from "@/pages/agent/AgentQueuePage";
import { AuthContext } from "@/context/AuthContext";
import * as ticketApi from "@/api/ticketApi";
import type { User } from "@/types/user.types";

const mockAgent: User = {
  _id: "agent123",
  name: "Alice Agent",
  email: "agent.alice@helpdesk.local",
  role: "agent",
  teamId: "tier1",
  deleted: false,
  deletedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockAdmin: User = {
  _id: "admin123",
  name: "Ada Admin",
  email: "admin@helpdesk.local",
  role: "admin",
  teamId: "ops",
  deleted: false,
  deletedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("AgentQueuePage component", () => {
  beforeEach(() => {
    vi.spyOn(ticketApi, "getTickets").mockResolvedValue({
      tickets: [
        {
          _id: "t1",
          subject: "Assigned Ticket",
          description: "Details",
          priority: "medium",
          status: "in_progress",
          customerId: { _id: "c1", name: "Carol", email: "carol@example.com" },
          assigneeId: { _id: "agent123", name: "Alice Agent", email: "alice@example.com" },
          categoryId: "cat1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          breached: false,
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it("renders My Assigned and Unassigned switcher tabs for agent", async () => {
    render(
      <MemoryRouter initialEntries={["/agent/queue?scope=assigned"]}>
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
          <AgentQueuePage />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: /my assigned/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /unassigned/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Assigned Ticket")).toBeInTheDocument();
    });
  });

  it("renders All Support Tickets heading for admin without scope tabs", async () => {
    render(
      <MemoryRouter initialEntries={["/agent/queue"]}>
        <AuthContext.Provider
          value={{
            user: mockAdmin,
            token: "tok",
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
            refreshUser: vi.fn(),
          }}
        >
          <AgentQueuePage />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText("All Support Tickets")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /my assigned/i })).not.toBeInTheDocument();
  });
});
