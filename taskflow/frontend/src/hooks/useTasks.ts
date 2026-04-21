import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Task, TaskStatus, TaskPriority } from "../types";

const tasksKey = (projectId: number) => ["tasks", projectId] as const;

export function useTasks(projectId: number) {
  return useQuery({
    queryKey: tasksKey(projectId),
    queryFn: async () => {
      const { data } = await api.get<{ tasks: Task[] }>(`/tasks/project/${projectId}`);
      return data.tasks;
    },
  });
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
}

export function useCreateTask(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTaskPayload) => {
      const { data } = await api.post<{ task: Task }>(`/tasks/project/${projectId}`, payload);
      return data.task;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tasksKey(projectId) });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  assignee_id?: number | null;
}

export function useUpdateTask(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateTaskPayload & { id: number }) => {
      const { data } = await api.patch<{ task: Task }>(`/tasks/${id}`, payload);
      return data.task;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: tasksKey(projectId) }),
  });
}

export function useDeleteTask(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: number) => {
      await api.delete(`/tasks/${taskId}`);
      return taskId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tasksKey(projectId) });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useReorderTasks(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskIds: number[]) => {
      await api.put(`/tasks/project/${projectId}/reorder`, { task_ids: taskIds });
    },
    onMutate: async (taskIds) => {
      // Optimistic update
      await qc.cancelQueries({ queryKey: tasksKey(projectId) });
      const previous = qc.getQueryData<Task[]>(tasksKey(projectId));
      if (previous) {
        const reordered = taskIds.map((id, i) => {
          const task = previous.find((t) => t.id === id)!;
          return { ...task, position: i };
        });
        qc.setQueryData(tasksKey(projectId), reordered);
      }
      return { previous };
    },
    onError: (_err, _ids, ctx) => {
      if (ctx?.previous) qc.setQueryData(tasksKey(projectId), ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: tasksKey(projectId) }),
  });
}
