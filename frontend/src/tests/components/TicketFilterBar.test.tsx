import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TicketFilterBar from "@/components/tickets/TicketFilterBar";
import BulkActionBar from "@/components/tickets/BulkActionBar";
import { AuthContext } from "@/context/AuthContext";
import type { User } from "@/types/user.types";

describe("TicketFilterBar component", () => {
  it("renders search input and filter selects", () => {
    const filters = {
      search: "",
      status: "" as const,
      priority: "" as const,
      categoryId: "",
      startDate: "",
      endDate: "",
    };
    const onFiltersChange = vi.fn();

    render(
      <TicketFilterBar filters={filters} onFiltersChange={onFiltersChange} />
    );

    expect(screen.getByPlaceholderText(/search by subject/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("All Statuses")).toBeInTheDocument();
    expect(screen.getByDisplayValue("All Priorities")).toBeInTheDocument();
  });

  it("triggers onFiltersChange when search or status changes", () => {
    const filters = {
      search: "",
      status: "" as const,
      priority: "" as const,
      categoryId: "",
      startDate: "",
      endDate: "",
    };
    const onFiltersChange = vi.fn();

    render(
      <TicketFilterBar filters={filters} onFiltersChange={onFiltersChange} />
    );

    const searchInput = screen.getByPlaceholderText(/search by subject/i);
    fireEvent.change(searchInput, { target: { value: "VPN" } });
    expect(onFiltersChange).toHaveBeenCalled();
  });
});

describe("BulkActionBar component", () => {
  const mockAgentUser: User = {
    _id: "agent123",
    name: "Alice Agent",
    email: "alice@example.com",
    role: "agent",
    teamId: "tier1",
    deleted: false,
    deletedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("renders selected count and action buttons for agent", () => {
    const selectedIds = new Set(["t1", "t2", "t3"]);
    render(
      <AuthContext.Provider
        value={{
          user: mockAgentUser,
          token: "dummy",
          isAuthenticated: true,
          isLoading: false,
          login: vi.fn(),
          logout: vi.fn(),
          refreshUser: vi.fn(),
        }}
      >
        <BulkActionBar
          selectedIds={selectedIds}
          onClearSelection={vi.fn()}
          onActionComplete={vi.fn()}
        />
      </AuthContext.Provider>
    );

    expect(screen.getByText(/3 tickets selected/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /bulk assign to me/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /bulk status change/i })).toBeInTheDocument();
  });
});
