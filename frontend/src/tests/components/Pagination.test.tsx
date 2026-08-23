import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Pagination from "@/components/common/Pagination";
import Spinner from "@/components/common/Spinner";

describe("Pagination component", () => {
  it("renders current page and total count info", () => {
    render(
      <Pagination
        page={1}
        totalPages={5}
        total={48}
        limit={10}
        onPageChange={vi.fn()}
        onLimitChange={vi.fn()}
      />
    );
    expect(screen.getByText(/48/i)).toBeInTheDocument();
  });

  it("handles next and previous page changes", () => {
    const handlePageChange = vi.fn();
    render(
      <Pagination
        page={2}
        totalPages={5}
        total={48}
        limit={10}
        onPageChange={handlePageChange}
        onLimitChange={vi.fn()}
      />
    );
    const prevBtn = screen.getByRole("button", { name: /previous/i });
    const nextBtn = screen.getByRole("button", { name: /next/i });

    fireEvent.click(nextBtn);
    expect(handlePageChange).toHaveBeenCalledWith(3);

    fireEvent.click(prevBtn);
    expect(handlePageChange).toHaveBeenCalledWith(1);
  });
});

describe("Spinner component", () => {
  it("renders spinner element", () => {
    const { container } = render(<Spinner size="lg" />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
