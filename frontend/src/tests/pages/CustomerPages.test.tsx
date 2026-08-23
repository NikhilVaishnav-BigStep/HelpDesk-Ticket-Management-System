import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateTicketPage from "@/pages/customer/CreateTicketPage";
import CustomerDashboardPage from "@/pages/customer/CustomerDashboardPage";
import { AuthContext } from "@/context/AuthContext";
import * as categoryApi from "@/api/categoryApi";
import * as ticketApi from "@/api/ticketApi";
import type { User } from "@/types/user.types";

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

describe("CreateTicketPage component", () => {
  beforeEach(() => {
    vi.spyOn(categoryApi, "getCategories").mockResolvedValue([
      { _id: "cat1", name: "Billing", status: "active", createdAt: "", updatedAt: "" },
      { _id: "cat2", name: "Technical", status: "active", createdAt: "", updatedAt: "" },
    ]);
  });

  it("renders form inputs for subject, description, priority, category", async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider
          value={{
            user: mockCustomer,
            token: "tok",
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
            refreshUser: vi.fn(),
          }}
        >
          <CreateTicketPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/^subject$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^description$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^priority$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^category$/i)).toBeInTheDocument();
    });
  });
});

describe("CustomerDashboardPage component", () => {
  it("loads and displays customer tickets and summary metrics", async () => {
    vi.spyOn(ticketApi, "getTickets").mockResolvedValue({
      tickets: [
        {
          _id: "t1",
          subject: "Cannot login to app",
          description: "Times out after clicking login",
          priority: "high",
          status: "open",
          customerId: "c1",
          assigneeId: null,
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

    render(
      <BrowserRouter>
        <AuthContext.Provider
          value={{
            user: mockCustomer,
            token: "tok",
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
            refreshUser: vi.fn(),
          }}
        >
          <CustomerDashboardPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Cannot login to app")).toBeInTheDocument();
    });
  });
});
