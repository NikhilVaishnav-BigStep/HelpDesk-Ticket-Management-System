import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Input from "@/components/common/Input";

describe("Input component", () => {
  it("renders with label and placeholder", () => {
    render(<Input id="email" label="Email Address" placeholder="you@example.com" />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
  });

  it("handles user typing value change", () => {
    const handleChange = vi.fn();
    render(<Input id="name" label="Name" onChange={handleChange} />);
    const input = screen.getByLabelText(/name/i);
    fireEvent.change(input, { target: { value: "Jane Doe" } });
    expect(handleChange).toHaveBeenCalled();
  });

  it("renders error message when error prop is provided", () => {
    render(<Input id="password" label="Password" error="Password is required" />);
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Input id="custom" label="Custom" className="bg-slate-100" />);
    const input = screen.getByLabelText(/custom/i);
    expect(input).toHaveClass("bg-slate-100");
  });
});
