import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import TicketTimeline from "@/components/tickets/TicketTimeline";
import { AuthContext } from "@/context/AuthContext";
import type { TimelineEntry } from "@/types/ticket.types";
import type { User } from "@/types/user.types";

const mockAgent: User = {
  _id: "a1",
  name: "Alice Agent",
  email: "alice@example.com",
  role: "agent",
  teamId: "tier1",
  deleted: false,
  deletedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockCustomer: User = {
  _id: "c1",
  name: "Carol Customer",
  email: "carol@example.com",
  role: "customer",
  teamId: null,
  deleted: false,
  deletedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockTimelineEntries: TimelineEntry[] = [
  {
    id: "entry1",
    type: "comment",
    createdAt: new Date().toISOString(),
    actor: { id: "c1", name: "Carol Customer", role: "customer" },
    data: {
      message: "Hello, I need help with my account.",
      type: "external",
    },
  },
  {
    id: "entry2",
    type: "comment",
    createdAt: new Date().toISOString(),
    actor: { id: "a1", name: "Alice Agent", role: "agent" },
    data: {
      message: "Internal investigation note for engineering.",
      type: "internal",
    },
  },
  {
    id: "entry3",
    type: "attachment",
    createdAt: new Date().toISOString(),
    actor: { id: "c1", name: "Carol Customer", role: "customer" },
    data: {
      fileName: "error_screenshot.png",
      size: 10240,
      mimeType: "image/png",
      storageKey: "seed/error_screenshot.png",
    },
  },
  {
    id: "entry4",
    type: "history",
    createdAt: new Date().toISOString(),
    actor: { id: "a1", name: "Alice Agent", role: "agent" },
    data: {
      action: "status_change",
      oldValue: "open",
      newValue: "in_progress",
    },
  },
];

describe("TicketTimeline component", () => {
  it("renders messages, yellow internal note badge, attachments, and history for agent", () => {
    render(
      <AuthContext.Provider
        value={{
          user: mockAgent,
          token: "tok",
          isAuthenticated: true,
          isLoading: false,
          login: () => Promise.resolve(),
          logout: () => {},
          refreshUser: () => Promise.resolve(),
        }}
      >
        <TicketTimeline timeline={mockTimelineEntries} />
      </AuthContext.Provider>
    );

    expect(screen.getByText("Hello, I need help with my account.")).toBeInTheDocument();
    expect(screen.getByText("Internal investigation note for engineering.")).toBeInTheDocument();
    expect(screen.getByText(/internal note/i)).toBeInTheDocument();
    expect(screen.getByText("error_screenshot.png")).toBeInTheDocument();
    expect(screen.getByText(/status change/i)).toBeInTheDocument();
  });

  it("hides internal note messages from customer", () => {
    render(
      <AuthContext.Provider
        value={{
          user: mockCustomer,
          token: "tok",
          isAuthenticated: true,
          isLoading: false,
          login: () => Promise.resolve(),
          logout: () => {},
          refreshUser: () => Promise.resolve(),
        }}
      >
        <TicketTimeline timeline={mockTimelineEntries} />
      </AuthContext.Provider>
    );

    expect(screen.getByText("Hello, I need help with my account.")).toBeInTheDocument();
    expect(screen.queryByText("Internal investigation note for engineering.")).not.toBeInTheDocument();
    expect(screen.queryByText(/internal note/i)).not.toBeInTheDocument();
  });
});
