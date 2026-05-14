export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface User {
  id: number;
  email: string;
  display_name: string;
  role: "user" | "admin";
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  owner_id: number;
  task_count: number;
  created_at: string;
  updated_at: string;
  tasks?: Task[];
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  due_date: string | null;
  project_id: number;
  assignee: User | null;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  error: string;
  status: number;
  details?: Record<string, string[]>;
}
