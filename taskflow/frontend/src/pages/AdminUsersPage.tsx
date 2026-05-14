import { useState } from "react";
import { useAdminUsers, useDeleteUser, useChangeRole } from "../hooks/useAdmin";
import { useAuthStore } from "../store/authStore";

export default function AdminUsersPage() {
  const { data: users = [], isLoading } = useAdminUsers();
  const deleteUser = useDeleteUser();
  const changeRole = useChangeRole();
  const [search, setSearch] = useState("");
  const currentUser = useAuthStore((s) => s.user);

  const filtered = users.filter(
    (u) =>
      u.display_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const adminCount = users.filter((u) => u.role === "admin").length;
  const userCount = users.filter((u) => u.role === "user").length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">👥</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="text-sm text-gray-500">View and manage all registered users</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-brand-600">{users.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Users</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">{adminCount}</p>
          <p className="text-xs text-gray-500 mt-1">Admins</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{userCount}</p>
          <p className="text-xs text-gray-500 mt-1">Regular Users</p>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Search users"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <div className="col-span-1">#</div>
          <div className="col-span-4">User</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {isLoading && (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">Loading users...</div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">
            {search ? "No users found" : "No users registered yet"}
          </div>
        )}

        {filtered.map((user, index) => {
          const isSelf = user.id === currentUser?.id;
          return (
            <div
              key={user.id}
              className={`grid grid-cols-12 gap-4 px-5 py-4 border-b border-gray-100 last:border-0 items-center transition-colors ${
                isSelf ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              <div className="col-span-1 text-sm text-gray-400">{index + 1}</div>

              <div className="col-span-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm shrink-0">
                  {user.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user.display_name}
                    {isSelf && (
                      <span className="ml-2 text-xs text-blue-500 font-normal">(You)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">ID: {user.id}</p>
                </div>
              </div>

              <div className="col-span-3">
                <p className="text-sm text-gray-600 truncate">{user.email}</p>
              </div>

              <div className="col-span-2">
                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                  user.role === "admin"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-green-100 text-green-700"
                }`}>
                  {user.role === "admin" ? "🛡️ Admin" : "👤 User"}
                </span>
              </div>

              <div className="col-span-2 flex items-center justify-end gap-2">
                {isSelf ? (
                  <span className="text-xs text-gray-300 italic">—</span>
                ) : (
                  <>
                    {user.role === "user" ? (
                      <button
                        onClick={() => changeRole.mutate({ userId: user.id, role: "admin" })}
                        className="text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                      >
                        Make Admin
                      </button>
                    ) : (
                      <button
                        onClick={() => changeRole.mutate({ userId: user.id, role: "user" })}
                        className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
                      >
                        Remove Admin
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to permanently delete "${user.display_name}"?`)) {
                          deleteUser.mutate(user.id);
                        }
                      }}
                      className="text-xs bg-red-50 text-red-500 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
