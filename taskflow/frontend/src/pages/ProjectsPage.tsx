import { useState } from "react";
import { Link } from "react-router-dom";
import { useProjects, useCreateProject, useDeleteProject } from "../hooks/useProjects";
import { getApiErrorMessage } from "../lib/api";

export default function ProjectsPage() {
  const { data: projects, isLoading, error } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const [newName, setNewName] = useState("");
  const [formError, setFormError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setFormError("");
    try {
      await createProject.mutateAsync({ name });
      setNewName("");
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    }
  }

  if (isLoading) return <p className="text-gray-500">Loading projects...</p>;
  if (error) return <p className="text-red-600">Failed to load projects.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Projects</h1>

      {/* Create form */}
      <form onSubmit={handleCreate} className="flex gap-2 mb-8">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New project name..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="New project name"
        />
        <button
          type="submit"
          disabled={createProject.isPending || !newName.trim()}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          Create
        </button>
      </form>

      {formError && <p className="text-red-600 text-sm mb-4">{formError}</p>}

      {projects?.length === 0 && (
        <p className="text-gray-400 text-sm">No projects yet. Create one above.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project) => (
          <div key={project.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <Link
                to={`/projects/${project.id}`}
                className="font-semibold text-gray-900 hover:text-brand-600 transition-colors"
              >
                {project.name}
              </Link>
              <button
                onClick={() => deleteProject.mutate(project.id)}
                className="text-gray-300 hover:text-red-500 transition-colors text-sm ml-2"
                aria-label={`Delete ${project.name}`}
              >
                ✕
              </button>
            </div>
            {project.description && (
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{project.description}</p>
            )}
            <p className="text-xs text-gray-400">{project.task_count} task{project.task_count !== 1 ? "s" : ""}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
