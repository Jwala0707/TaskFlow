import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task, TaskStatus, TaskPriority } from "../types";

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

interface Props {
  task: Task;
  onStatusChange: (id: number, status: TaskStatus) => void;
  onDelete: (id: number) => void;
}

export default function TaskCard({ task, onStatusChange, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          ⠿
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
              {task.priority}
            </span>
            {task.due_date && (
              <span className="text-xs text-gray-400">
                Due {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
          </div>

          <p className={`text-sm font-medium ${task.status === "done" ? "line-through text-gray-400" : "text-gray-900"}`}>
            {task.title}
          </p>

          {task.description && (
            <p className="text-xs text-gray-500 mt-1 truncate">{task.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
            className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
            aria-label="Task status"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <button
            onClick={() => onDelete(task.id)}
            className="text-gray-300 hover:text-red-500 transition-colors text-sm"
            aria-label="Delete task"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
