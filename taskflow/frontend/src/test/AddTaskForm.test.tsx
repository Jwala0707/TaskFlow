import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AddTaskForm from "../components/AddTaskForm";

describe("AddTaskForm", () => {
  it("calls onAdd with trimmed title and selected priority", () => {
    const onAdd = vi.fn();
    render(<AddTaskForm onAdd={onAdd} isLoading={false} />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "  New task  " } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "high" } });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(onAdd).toHaveBeenCalledWith("New task", "high");
  });

  it("does not call onAdd when title is empty", () => {
    const onAdd = vi.fn();
    render(<AddTaskForm onAdd={onAdd} isLoading={false} />);
    fireEvent.submit(screen.getByRole("textbox").closest("form")!);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("disables the button while loading", () => {
    render(<AddTaskForm onAdd={vi.fn()} isLoading={true} />);
    expect(screen.getByRole("button", { name: /add/i })).toBeDisabled();
  });
});
