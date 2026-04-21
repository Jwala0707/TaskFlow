import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskCard from "../components/TaskCard";
import type { Task } from "../types";

// dnd-kit requires a DOM environment; mock the sortable hook
vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));
vi.mock("@dnd-kit/utilities", () => ({ CSS: { Transform: { toString: () => "" } } }));

const baseTask: Task = {
  id: 1,
  title: "Write tests",
  description: null,
  status: "todo",
  priority: "medium",
  position: 0,
  due_date: null,
  project_id: 1,
  assignee: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("TaskCard", () => {
  it("renders the task title", () => {
    render(<TaskCard task={baseTask} onStatusChange={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Write tests")).toBeInTheDocument();
  });

  it("calls onStatusChange when status select changes", () => {
    const onStatusChange = vi.fn();
    render(<TaskCard task={baseTask} onStatusChange={onStatusChange} onDelete={vi.fn()} />);
    fireEvent.change(screen.getByRole("combobox", { name: /task status/i }), {
      target: { value: "done" },
    });
    expect(onStatusChange).toHaveBeenCalledWith(1, "done");
  });

  it("calls onDelete when delete button clicked", () => {
    const onDelete = vi.fn();
    render(<TaskCard task={baseTask} onStatusChange={vi.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole("button", { name: /delete task/i }));
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it("strikes through title when status is done", () => {
    const doneTask = { ...baseTask, status: "done" as const };
    render(<TaskCard task={doneTask} onStatusChange={vi.fn()} onDelete={vi.fn()} />);
    const title = screen.getByText("Write tests");
    expect(title.className).toContain("line-through");
  });
});
