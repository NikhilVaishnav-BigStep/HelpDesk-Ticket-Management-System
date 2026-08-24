import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminCategoriesPage from "@/pages/admin/AdminCategoriesPage";
import AdminSlaPage from "@/pages/admin/AdminSlaPage";
import AdminReportsPage from "@/pages/admin/AdminReportsPage";
import { AuthContext } from "@/context/AuthContext";
import * as userApi from "@/api/userApi";
import * as categoryApi from "@/api/categoryApi";
import * as slaApi from "@/api/slaApi";
import * as reportApi from "@/api/reportApi";

const mockAdminUser = {
  _id: "u1",
  name: "Ada Admin",
  email: "admin@helpdesk.local",
  role: "admin" as const,
  teamId: "ops",
  deleted: false,
  deletedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("AdminUsersPage component", () => {
  beforeEach(() => {
    vi.spyOn(userApi, "getUsers").mockResolvedValue({
      users: [mockAdminUser],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it("renders user table with names and roles", async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider
          value={{
            user: mockAdminUser,
            token: "tok",
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
            refreshUser: vi.fn(),
          }}
        >
          <AdminUsersPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Ada Admin")).toBeInTheDocument();
      expect(screen.getByText("admin@helpdesk.local")).toBeInTheDocument();
    });
  });
});

describe("AdminCategoriesPage component", () => {
  beforeEach(() => {
    vi.spyOn(categoryApi, "getCategories").mockResolvedValue([
      { _id: "c1", name: "Billing", status: "active", createdAt: "", updatedAt: "" },
      { _id: "c2", name: "Technical", status: "active", createdAt: "", updatedAt: "" },
    ]);
  });

  it("renders categories list", async () => {
    render(
      <BrowserRouter>
        <AdminCategoriesPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Billing")).toBeInTheDocument();
      expect(screen.getByText("Technical")).toBeInTheDocument();
    });
  });
});

describe("AdminSlaPage component", () => {
  beforeEach(() => {
    vi.spyOn(slaApi, "getSlaPolicies").mockResolvedValue([
      {
        priority: "low",
        responseTarget: 240,
        resolutionTarget: 2880,
        isCustomized: false,
      },
      {
        priority: "urgent",
        responseTarget: 15,
        resolutionTarget: 120,
        isCustomized: true,
      },
    ]);
  });

  it("renders SLA priority policies", async () => {
    render(
      <BrowserRouter>
        <AdminSlaPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("LOW")).toBeInTheDocument();
      expect(screen.getByText("URGENT")).toBeInTheDocument();
    });
  });
});

describe("AdminReportsPage component", () => {
  beforeEach(() => {
    vi.spyOn(categoryApi, "getCategories").mockResolvedValue([
      { _id: "c1", name: "Billing", status: "active", createdAt: "", updatedAt: "" },
    ]);

    vi.spyOn(reportApi, "getTicketReport").mockResolvedValue({
      summary: {
        totalTickets: 10,
        openTickets: 2,
        assignedTickets: 1,
        inProgressTickets: 3,
        resolvedTickets: 2,
        closedTickets: 2,
        breachedTickets: 2,
        breachRate: 20,
      },
      performance: {
        avgResponseTimeMinutes: 90,
        avgResolutionTimeMinutes: 720,
      },
      byPriority: {
        low: { total: 2, breached: 0, breachRate: 0 },
        medium: { total: 3, breached: 0, breachRate: 0 },
        high: { total: 3, breached: 1, breachRate: 33.3 },
        urgent: { total: 2, breached: 1, breachRate: 50 },
      },
      byStatus: {
        open: 2,
        assigned: 1,
        in_progress: 3,
        resolved: 2,
        closed: 2,
      },
      byCategory: [
        {
          categoryId: "c1",
          categoryName: "Billing",
          total: 3,
          breached: 0,
        },
      ],
    });
  });

  it("renders ticket metrics summary and breach statistics", async () => {
    render(
      <BrowserRouter>
        <AdminReportsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Reports & SLA Analytics")).toBeInTheDocument();
      expect(screen.getAllByText("Total Tickets").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("SLA Breach Rate")).toBeInTheDocument();
    });
  });
});
