import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { User, Project } from "../types";

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data } = await api.get<{ users: User[] }>("/admin/users");
      return data.users;
    },
  });
}

export function useAdminProjects() {
  return useQuery({
    queryKey: ["admin", "projects"],
    queryFn: async () => {
      const { data } = await api.get<{ projects: Project[] }>("/admin/projects");
      return data.projects;
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => {
      await api.delete(`/admin/users/${userId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useChangeRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: "user" | "admin" }) => {
      const { data } = await api.patch(`/admin/users/${userId}/role`, { role });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}
