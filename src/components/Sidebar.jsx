import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { calculateStatus } from "../utils/statusCalculator";

const Sidebar = React.memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const { wishlist } = useWishlist();
  const username = localStorage.getItem("username") || "User";

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleWishlistClick = (variableId) => {
    navigate(`/analytics/${variableId}`);
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-deep-navy text-white flex flex-col">
      {/* Logo/Brand Section */}
      <div className="h-[84px] flex items-center px-6 border-b border-medium-purple">
        <h1 className="text-2xl font-bold text-white">Paperlytics</h1>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2 mb-8">
          <Link
            to="/dashboard"
            className={`block px-4 py-3 rounded-lg transition-colors ${
              isActive("/dashboard")
                ? "bg-medium-purple text-white"
                : "text-gray-300 hover:bg-medium-purple hover:text-white"
            }`}
          >
            Dashboard
          </Link>
        </div>

        {/* Wishlist Section */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-3 px-4">
            <span className="text-xl">⭐</span>
            <h2 className="text-lg font-semibold text-white">Wishlist</h2>
            {wishlist.length > 0 && (
              <span className="bg-success-green text-deep-navy text-xs font-bold px-2 py-0.5 rounded-full">
                {wishlist.length}
              </span>
            )}
          </div>
          {wishlist.length === 0 ? (
            <div className="px-4 py-6 bg-card-bg rounded-lg">
              <p className="text-sm text-gray-400 text-center italic">
                No variables added yet
              </p>
              <p className="text-xs text-gray-500 text-center mt-2">
                Click ⭐ on any variable to add
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {wishlist.slice(0, 10).map((variable) => {
                  const status = calculateStatus(variable);
                  return (
                    <button
                      key={variable.id}
                      onClick={() => handleWishlistClick(variable.id)}
                      className="w-full px-4 py-3 bg-card-bg hover:bg-[#252464] rounded-lg text-left transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate group-hover:text-success-green transition-colors">
                            {variable.shortName}
                          </p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {variable.lastValue}
                          </p>
                        </div>
                        <span
                          className={`ml-2 text-lg ${
                            status === "warning"
                              ? "text-warning-red"
                              : "text-success-green"
                          }`}
                        >
                          {status === "warning" ? "⚠️" : "✓"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {wishlist.length > 10 && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Showing 10 of {wishlist.length} variables
                </p>
              )}
            </>
          )}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-6 border-t border-medium-purple">
        <div className="mb-4">
          <p className="text-sm text-gray-400">Logged in as</p>
          <p className="text-lg font-semibold text-white capitalize">
            {username}
          </p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem("isAuthenticated");
            localStorage.removeItem("username");
            navigate("/login");
          }}
          className="w-full bg-medium-purple hover:bg-light-purple text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;
