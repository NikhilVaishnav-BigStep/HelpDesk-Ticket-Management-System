import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AuthProvider, AuthContext } from "@/context/AuthContext";
import { useContext } from "react";
import { authApi } from "@/api/authApi";

function TestConsumer() {
  const auth = useContext(AuthContext);
  if (!auth) return <div>No context</div>;

  return (
    <div>
      <span data-testid="auth-status">{auth.isAuthenticated ? "authenticated" : "guest"}</span>
      <span data-testid="user-name">{auth.user?.name ?? "none"}</span>
      <button
        onClick={() =>
          auth.login("agent.alice@helpdesk.local", "Agent@1234")
        }
      >
        Log In
      </button>
      <button onClick={() => auth.logout()}>Log Out</button>
    </div>
  );
}

describe("AuthContext", () => {
  it("defaults to guest state when localStorage is empty", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("auth-status")).toHaveTextContent("guest");
    expect(screen.getByTestId("user-name")).toHaveTextContent("none");
  });

  it("handles login and updates state", async () => {
    vi.spyOn(authApi, "login").mockResolvedValueOnce({
      token: "mock-jwt-token",
      user: {
        _id: "agent123",
        id: "agent123",
        name: "Alice Agent",
        email: "agent.alice@helpdesk.local",
        role: "agent",
        teamId: "tier1",
        deleted: false,
        deletedAt: null,
        createdAt: "",
        updatedAt: "",
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText("Log In").click();
    });

    expect(screen.getByTestId("auth-status")).toHaveTextContent("authenticated");
    expect(screen.getByTestId("user-name")).toHaveTextContent("Alice Agent");
  });

  it("handles logout and clears state", async () => {
    localStorage.setItem("helpdesk_token", "saved-token");
    localStorage.setItem(
      "helpdesk_user",
      JSON.stringify({ _id: "u1", name: "Carol", email: "carol@example.com", role: "customer" })
    );

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("auth-status")).toHaveTextContent("authenticated");

    act(() => {
      screen.getByText("Log Out").click();
    });

    expect(screen.getByTestId("auth-status")).toHaveTextContent("guest");
  });
});
