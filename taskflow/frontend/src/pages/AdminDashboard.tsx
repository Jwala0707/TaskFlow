import { useAdminUsers, useAdminProjects, useDeleteUser, useChangeRole } from "../hooks/useAdmin";

export default function AdminDashboard() {
  const { data: users = [], isLoading: usersLoading } = useAdminUsers();
  const { data: projects = [], isLoading: projectsLoading } = useAdminProjects();
  const deleteUser = useDeleteUser();
  const changeRole = useChangeRole();

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <span className="text-2xl">🛡️</span>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-3xl font-bold text-brand-600">{users.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total Users</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-3xl font-bold text-purple-600">{projects.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total Projects</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 mb-8">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Users</h2>
        </div>
        {usersLoading ? (
          <p className="text-gray-400 text-sm p-5">Loading...</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.display_name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    user.role === "admin"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {user.role}
                  </span>
                  <select
                    value={user.role}
                    onChange={(e) =>
                      changeRole.mutate({ userId: user.id, role: e.target.value as "user" | "admin" })
                    }
                    className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                    aria-label={`Change role for ${user.display_name}`}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${user.display_name}"?`)) {
                        deleteUser.mutate(user.id);
                      }
                    }}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    aria-label={`Delete ${user.display_name}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Projects</h2>
        </div>
        {projectsLoading ? (
          <p className="text-gray-400 text-sm p-5">Loading...</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {projects.map((project) => (
              <div key={project.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{project.name}</p>
                  {project.description && (
                    <p className="text-xs text-gray-400 truncate max-w-xs">{project.description}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {project.task_count} task{project.task_count !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="text-gray-400 text-sm p-5">No projects found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
