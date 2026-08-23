import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Badge from "@/components/common/Badge";

describe("Badge component", () => {
  it("renders badge text", () => {
    render(<Badge variant="open">Open</Badge>);
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("supports status and priority variants", () => {
    const { rerender } = render(<Badge variant="urgent">Urgent</Badge>);
    expect(screen.getByText("Urgent")).toBeInTheDocument();

    rerender(<Badge variant="resolved">Resolved</Badge>);
    expect(screen.getByText("Resolved")).toBeInTheDocument();

    rerender(<Badge variant="breach">SLA Breached</Badge>);
    expect(screen.getByText("SLA Breached")).toBeInTheDocument();
  });
});
