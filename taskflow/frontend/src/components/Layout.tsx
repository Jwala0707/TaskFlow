import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <Link to="/projects" className="text-xl font-bold text-brand-600">
          TaskFlow
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.display_name}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-6 py-8 max-w-5xl">
        <Outlet />
      </main>
    </div>
  );
}
