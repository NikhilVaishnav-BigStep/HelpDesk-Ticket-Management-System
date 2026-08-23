import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Select from "@/components/common/Select";

describe("Select component", () => {
  it("renders with options and label", () => {
    render(
      <Select id="role" label="Role">
        <option value="customer">Customer</option>
        <option value="agent">Agent</option>
        <option value="admin">Admin</option>
      </Select>
    );
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("handles selection change", () => {
    const handleChange = vi.fn();
    render(
      <Select id="priority" label="Priority" onChange={handleChange}>
        <option value="low">Low</option>
        <option value="high">High</option>
      </Select>
    );
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "high" } });
    expect(handleChange).toHaveBeenCalled();
  });

  it("displays error message", () => {
    render(
      <Select id="cat" label="Category" error="Category is required">
        <option value="">Select...</option>
      </Select>
    );
    expect(screen.getByText(/category is required/i)).toBeInTheDocument();
  });
});
