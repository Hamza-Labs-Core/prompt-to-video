import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";

const RootLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-gray-950/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center space-x-2">
                <svg
                  className="h-8 w-8 text-blue-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                <span className="text-xl font-semibold">Prompt to Video</span>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="flex items-center space-x-6">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/"
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-blue-400",
                      "text-gray-300"
                    )}
                  >
                    New Project
                  </Link>
                  <Link
                    to="/settings"
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-blue-400",
                      "text-gray-300"
                    )}
                  >
                    Settings
                  </Link>
                  <div className="flex items-center space-x-4 border-l border-gray-700 pl-6">
                    <span className="text-sm text-gray-400">{user?.email}</span>
                    <button
                      onClick={handleLogout}
                      className="text-sm font-medium text-gray-400 hover:text-red-400 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-blue-400",
                      "text-gray-300"
                    )}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-800 bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-gray-950/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center space-y-2">
            <p className="text-sm text-gray-400">
              Powered by{" "}
              <a
                href="https://fal.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                fal.ai
              </a>
              {" + "}
              <a
                href="https://workers.cloudflare.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-300 transition-colors font-medium"
              >
                Cloudflare Workers
              </a>
            </p>
            <p className="text-xs text-gray-500">
              AI-powered video generation pipeline
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RootLayout;
