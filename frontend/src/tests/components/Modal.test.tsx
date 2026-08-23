import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Modal from "@/components/common/Modal";

describe("Modal component", () => {
  it("does not render when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
        Modal Content
      </Modal>
    );
    expect(screen.queryByText("Test Modal")).not.toBeInTheDocument();
  });

  it("renders title, content, and close button when isOpen is true", () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Assign Ticket">
        <p>Select an agent to assign</p>
      </Modal>
    );
    expect(screen.getByText("Assign Ticket")).toBeInTheDocument();
    expect(screen.getByText("Select an agent to assign")).toBeInTheDocument();
  });

  it("calls onClose when close button or backdrop is clicked", () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Close Modal">
        Modal Body
      </Modal>
    );
    const closeBtn = screen.getByRole("button");
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });
});
