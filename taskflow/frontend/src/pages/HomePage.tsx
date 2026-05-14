import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useProjects } from "../hooks/useProjects";

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const { data: projects = [] } = useProjects();

  const totalTasks = projects.reduce((sum, p) => sum + p.task_count, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.display_name} 👋
        </h1>
        <p className="text-gray-500 mt-1">What would you like to do today?</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-4xl font-bold text-brand-600">{projects.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total Projects</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-4xl font-bold text-purple-600">{totalTasks}</p>
          <p className="text-sm text-gray-500 mt-1">Total Tasks</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link
          to="/projects"
          className="bg-brand-600 text-white rounded-xl p-5 hover:bg-brand-700 transition-colors"
        >
          <p className="text-2xl mb-2">📋</p>
          <p className="font-semibold">My Projects</p>
          <p className="text-sm text-blue-100 mt-1">View all your projects</p>
        </Link>

        {user?.role === "admin" && (
          <Link
            to="/admin/users"
            className="bg-purple-600 text-white rounded-xl p-5 hover:bg-purple-700 transition-colors"
          >
            <p className="text-2xl mb-2">👥</p>
            <p className="font-semibold">Manage Users</p>
            <p className="text-sm text-purple-100 mt-1">View and manage all users</p>
          </Link>
        )}
      </div>

      {projects.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Projects</h2>
          <div className="space-y-2">
            {projects.slice(0, 5).map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-4 hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="font-medium text-gray-900">{project.name}</p>
                  {project.description && (
                    <p className="text-sm text-gray-400 truncate max-w-xs">{project.description}</p>
                  )}
                </div>
                <span className="text-sm text-gray-400">
                  {project.task_count} task{project.task_count !== 1 ? "s" : ""}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {projects.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-4xl mb-3">🚀</p>
          <p className="text-gray-600 font-medium">No projects yet</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">Create your first project and get started</p>
          <Link
            to="/projects"
            className="inline-block bg-brand-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Create Project
          </Link>
        </div>
      )}
    </div>
  );
}
