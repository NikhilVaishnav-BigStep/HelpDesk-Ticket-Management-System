import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Alert from "@/components/common/Alert";

describe("Alert component", () => {
  it("renders children content with success variant", () => {
    render(<Alert variant="success">Operation completed successfully!</Alert>);
    expect(screen.getByText(/operation completed successfully!/i)).toBeInTheDocument();
  });

  it("renders error variant with alert role", () => {
    render(<Alert variant="error">Something went wrong!</Alert>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/something went wrong!/i)).toBeInTheDocument();
  });

  it("renders title when provided", () => {
    render(
      <Alert variant="warning" title="Warning Header">
        Warning details description.
      </Alert>
    );
    expect(screen.getByText("Warning Header")).toBeInTheDocument();
    expect(screen.getByText("Warning details description.")).toBeInTheDocument();
  });
});
