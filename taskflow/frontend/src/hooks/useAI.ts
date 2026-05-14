import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { TaskPriority } from "../types";

export interface ParsedTask {
  title: string;
  description: string | null;
  priority: TaskPriority;
  due_date: string | null;
}

export interface SuggestedTask {
  title: string;
  priority: TaskPriority;
}

export function useParseTask() {
  return useMutation({
    mutationFn: async (text: string): Promise<ParsedTask> => {
      const { data } = await api.post<ParsedTask>("/ai/parse-task", { text });
      return data;
    },
  });
}

export function useSuggestTasks() {
  return useMutation({
    mutationFn: async (payload: {
      project_name: string;
      description?: string | null;
    }): Promise<SuggestedTask[]> => {
      const { data } = await api.post<{ tasks: SuggestedTask[] }>(
        "/ai/suggest-tasks",
        payload
      );
      return data.tasks;
    },
  });
}
