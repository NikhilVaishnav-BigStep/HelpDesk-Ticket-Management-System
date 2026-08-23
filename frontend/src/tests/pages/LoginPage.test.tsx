import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import LoginPage from "@/pages/auth/LoginPage";
import { AuthContext } from "@/context/AuthContext";

describe("LoginPage component", () => {
  it("renders login form with email and password inputs", () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider
          value={{
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
            refreshUser: vi.fn(),
          }}
        >
          <LoginPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("submits form and calls auth login", async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined);

    render(
      <BrowserRouter>
        <AuthContext.Provider
          value={{
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            login: mockLogin,
            logout: vi.fn(),
            refreshUser: vi.fn(),
          }}
        >
          <LoginPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: "agent.alice@helpdesk.local" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "Agent@1234" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        "agent.alice@helpdesk.local",
        "Agent@1234"
      );
    });
  });
});
