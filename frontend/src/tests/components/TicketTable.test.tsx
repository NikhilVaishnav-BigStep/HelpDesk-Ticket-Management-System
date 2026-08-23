import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import TicketTable from "@/components/tickets/TicketTable";
import type { Ticket } from "@/types/ticket.types";

const mockTickets: Ticket[] = [
  {
    _id: "6a8b11111111111111111111",
    subject: "Cannot connect to VPN",
    description: "VPN timeout error",
    priority: "high",
    status: "open",
    customerId: { _id: "u1", name: "Carol Customer", email: "carol@example.com" },
    assigneeId: null,
    categoryId: "cat1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    breached: false,
  },
  {
    _id: "6a8b22222222222222222222",
    subject: "Billing invoice issue",
    description: "Wrong amount charged",
    priority: "urgent",
    status: "in_progress",
    customerId: { _id: "u2", name: "Dave Customer", email: "dave@example.com" },
    assigneeId: { _id: "a1", name: "Alice Agent", email: "alice@example.com" },
    categoryId: "cat2",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    breached: true,
  },
];

describe("TicketTable component", () => {
  it("renders ticket list with subject, customer, and assignee names", () => {
    render(
      <BrowserRouter>
        <TicketTable tickets={mockTickets} variant="agent" />
      </BrowserRouter>
    );

    expect(screen.getByText("Cannot connect to VPN")).toBeInTheDocument();
    expect(screen.getByText("Carol Customer")).toBeInTheDocument();
    expect(screen.getByText("Unassigned")).toBeInTheDocument();

    expect(screen.getByText("Billing invoice issue")).toBeInTheDocument();
    expect(screen.getByText("Alice Agent")).toBeInTheDocument();
  });

  it("renders empty state when ticket array is empty", () => {
    render(
      <BrowserRouter>
        <TicketTable tickets={[]} variant="customer" />
      </BrowserRouter>
    );
    expect(screen.getByText(/no tickets found/i)).toBeInTheDocument();
  });

  it("handles selectable rows when selectable is true", () => {
    const selectedIds = new Set<string>(["6a8b11111111111111111111"]);
    const onSelectionChange = vi.fn();

    render(
      <BrowserRouter>
        <TicketTable
          tickets={mockTickets}
          variant="agent"
          selectable
          selectedIds={selectedIds}
          onSelectionChange={onSelectionChange}
        />
      </BrowserRouter>
    );

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(0);
  });
});
