import { useParams, Link } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useProject } from "../hooks/useProjects";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useReorderTasks } from "../hooks/useTasks";
import TaskCard from "../components/TaskCard";
import AddTaskForm from "../components/AddTaskForm";
import type { TaskStatus, TaskPriority } from "../types";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(projectId);
  const createTask = useCreateTask(projectId);
  const updateTask = useUpdateTask(projectId);
  const deleteTask = useDeleteTask(projectId);
  const reorderTasks = useReorderTasks(projectId);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...tasks];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    reorderTasks.mutate(reordered.map((t) => t.id));
  }

  if (projectLoading || tasksLoading) return <p className="text-gray-500">Loading...</p>;
  if (!project) return <p className="text-red-600">Project not found.</p>;

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const doneTasks = tasks.filter((t) => t.status === "done");

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Link to="/projects" className="text-sm text-gray-400 hover:text-gray-600">Projects</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600">{project.name}</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">{project.name}</h1>

      {/* Stats */}
      <div className="flex gap-4 mb-6 text-sm">
        <span className="text-gray-500">{todoTasks.length} to do</span>
        <span className="text-blue-500">{inProgressTasks.length} in progress</span>
        <span className="text-green-500">{doneTasks.length} done</span>
      </div>

      {/* Task list with drag-and-drop */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={(taskId, status: TaskStatus) =>
                  updateTask.mutate({ id: taskId, status })
                }
                onDelete={(taskId) => deleteTask.mutate(taskId)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {tasks.length === 0 && (
        <p className="text-gray-400 text-sm py-4">No tasks yet. Add one below.</p>
      )}

      <AddTaskForm
        onAdd={(title, priority: TaskPriority) => createTask.mutate({ title, priority })}
        isLoading={createTask.isPending}
      />
    </div>
  );
}
