import { useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  function handleLogoutConfirm() {
    logout();
    setShowLogoutModal(false);
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-xl font-bold text-brand-600 select-none">
            TaskFlow
          </span>
          <nav className="flex items-center gap-4">
            <Link to="/home" className="text-sm text-gray-600 hover:text-brand-600 font-medium transition-colors">
              🏠 Home
            </Link>
            <Link to="/projects" className="text-sm text-gray-600 hover:text-brand-600 font-medium transition-colors">
              📋 Projects
            </Link>
            {user?.role === "admin" && (
              <>
                <Link to="/admin" className="text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors">
                  🛡️ Dashboard
                </Link>
                <Link to="/admin/users" className="text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors">
                  👥 Users
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user?.display_name}
            {user?.role === "admin" && (
              <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                admin
              </span>
            )}
          </span>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-8 max-w-5xl">
        <Outlet />
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-40"
            onClick={() => setShowLogoutModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 z-10">
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">👋</div>
              <h2 className="text-lg font-bold text-gray-900">Are you sure you want to sign out?</h2>
              <p className="text-sm text-gray-500 mt-1">
                You will be logged out and redirected to the login page.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Yes, Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
