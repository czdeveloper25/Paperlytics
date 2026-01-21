import React, { useMemo, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
// import { useWishlist } from "../context/WishlistContext"; // COMMENTED OUT - Keep for future
import { processVariables } from "../data/processVariables";
import { useSCTCurrentValue } from "../context/SCTContext";
import { useTheme } from "../context/ThemeContext";
import { useRefreshContext } from "../context/VariableRefreshContext";
import { useSidebar } from "../context/SidebarContext";

const Sidebar = React.memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const { isSidebarOpen, closeSidebar } = useSidebar();
  // const { wishlist } = useWishlist(); // COMMENTED OUT - Keep for future
  const username = localStorage.getItem("username") || "User";

  // Get ONLY live SCT data (for variable ID 2)
  const sctValue = useSCTCurrentValue();

  // Get refreshed values from refresh context
  const { refreshedValues } = useRefreshContext();

  // State for dismissed action items (persisted in localStorage)
  const [dismissedActions, setDismissedActions] = useState(() => {
    const stored = localStorage.getItem('dismissedActionItems');
    return stored ? JSON.parse(stored) : [];
  });

  // Get warning variables - DYNAMIC with refresh values
  const warningVariables = useMemo(() => {
    return processVariables.filter(variable => {
      // For SCT variable (ID: 2), use live data
      if (variable.id === 2 && variable.useLiveData && variable.dataSource === 'sct' && sctValue) {
        const numValue = parseFloat(sctValue.value);
        return (numValue > variable.upperThreshold || numValue < variable.lowerThreshold);
      }

      // For all other variables, check refreshed values first, fall back to lastValue
      const refreshed = refreshedValues[variable.id];
      const currentValue = refreshed
        ? parseFloat(refreshed.value)
        : parseFloat(variable.lastValue);

      return (currentValue > variable.upperThreshold ||
              currentValue < variable.lowerThreshold);
    });
  }, [sctValue, refreshedValues]); // Re-compute when SCT or refreshed values change

  // Auto-cleanup: Remove dismissed items that are no longer warnings
  useEffect(() => {
    const currentWarningIds = warningVariables.map(v => v.id);
    const stillWarnings = dismissedActions.filter(id => currentWarningIds.includes(id));

    if (stillWarnings.length !== dismissedActions.length) {
      setDismissedActions(stillWarnings);
      localStorage.setItem('dismissedActionItems', JSON.stringify(stillWarnings));
    }
  }, [warningVariables, dismissedActions]);

  // Filter out dismissed warnings for Action Items section
  const activeWarnings = useMemo(() => {
    return warningVariables.filter(v => !dismissedActions.includes(v.id));
  }, [warningVariables, dismissedActions]);

  // Handler to dismiss an action item
  const handleDismiss = (variableId, e) => {
    e.stopPropagation(); // Prevent navigation
    const updated = [...dismissedActions, variableId];
    setDismissedActions(updated);
    localStorage.setItem('dismissedActionItems', JSON.stringify(updated));
  };

  // Handler to restore all dismissed items
  const clearDismissed = () => {
    setDismissedActions([]);
    localStorage.removeItem('dismissedActionItems');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Get warning type - with live SCT support and refreshed values
  const getWarningType = (variable) => {
    let currentValue;

    // For SCT variable (ID: 2), use live data
    if (variable.id === 2 && variable.useLiveData && variable.dataSource === 'sct' && sctValue) {
      currentValue = parseFloat(sctValue.value);
    } else {
      // For all other variables, check refreshed values first
      const refreshed = refreshedValues[variable.id];
      currentValue = refreshed
        ? parseFloat(refreshed.value)
        : parseFloat(variable.lastValue);
    }

    if (currentValue > variable.upperThreshold) {
      return 'High Warning';
    } else if (currentValue < variable.lowerThreshold) {
      return 'Low Warning';
    }
    return 'Normal';
  };

  const handleWarningClick = (variableId) => {
    navigate(`/analytics/${variableId}`);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (window.innerWidth < 1024 && isSidebarOpen) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && !sidebar.contains(e.target) && !e.target.closest('[data-hamburger]')) {
          closeSidebar();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen, closeSidebar]);

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        id="sidebar"
        className={`fixed left-0 top-0 h-screen w-64 bg-white dark:bg-black text-gray-900 dark:text-white flex flex-col border-r border-gray-300 dark:border-gray-700 z-40 transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
      {/* Logo/Brand Section */}
      <div className="h-[84px] flex items-center px-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paperlytics</h1>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2 mb-8">
          <Link
            to="/dashboard"
            className={`block px-4 py-3 rounded-lg transition-colors ${
              isActive("/dashboard")
                ? "bg-gray-200 dark:bg-medium-purple text-gray-900 dark:text-white"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-medium-purple hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Dashboard
          </Link>
        </div>

        {/* Warning Items Section - NEW */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-3 px-4">
            <span className="text-xl">⚠️</span>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Warning Items</h2>
            {warningVariables.length > 0 && (
              <span className="bg-warning-red text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {warningVariables.length}
              </span>
            )}
          </div>

          {warningVariables.length === 0 ? (
            <div className="px-4 py-6 bg-gray-100 dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-success-green text-center font-medium">
                ✓ All systems normal
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                No warnings detected
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {warningVariables.map((variable) => {
                const warningType = getWarningType(variable);
                const isHighWarning = warningType === 'High Warning';

                return (
                  <button
                    key={variable.id}
                    onClick={() => handleWarningClick(variable.id)}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-[#252464] rounded-lg text-left transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate flex-1 group-hover:text-warning-red transition-colors">
                        {variable.name}
                      </p>
                      <span className="ml-2 text-warning-red text-lg">⚠️</span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                      {variable.lastValue}
                    </p>
                    <p className={`text-xs font-medium mt-1 ${
                      isHighWarning ? 'text-warning-red' : 'text-orange-400'
                    }`}>
                      {warningType}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Items Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3 px-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Action Items</h2>
              {activeWarnings.length > 0 && (
                <span className="bg-warning-red text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {activeWarnings.length}
                </span>
              )}
            </div>
            {dismissedActions.length > 0 && (
              <button
                onClick={clearDismissed}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-success-green transition-colors"
                title={`Show ${dismissedActions.length} dismissed`}
              >
                Show {dismissedActions.length}
              </button>
            )}
          </div>

          {activeWarnings.length === 0 ? (
            <div className="px-4 py-6 bg-gray-100 dark:bg-gray-900 rounded-lg border border-success-green">
              <div className="text-center">
                <span className="text-3xl mb-2 block">✓</span>
                <p className="text-sm text-success-green font-medium">
                  All Systems Normal
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {dismissedActions.length > 0
                    ? `${dismissedActions.length} dismissed • Click "Show" to restore`
                    : 'No corrective actions required'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {activeWarnings.map((variable) => (
                <div
                  key={variable.id}
                  className="relative w-full text-left px-4 py-3 bg-gray-100 dark:bg-gray-900 rounded-lg border border-warning-red hover:bg-gray-200 dark:hover:bg-[#252464] transition-all group"
                >
                  <button
                    onClick={() => navigate(`/analytics/${variable.id}`)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-3 pr-6">
                      <span className="text-warning-red text-lg flex-shrink-0">⚠️</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-gray-900 dark:text-white text-sm font-bold group-hover:text-success-green transition-colors truncate">
                            {variable.shortName}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {getWarningType(variable)}
                        </p>
                        <p className="text-xs text-success-green group-hover:underline">
                          Click for action steps →
                        </p>
                      </div>
                    </div>
                  </button>
                  {/* Dismiss Button */}
                  <button
                    onClick={(e) => handleDismiss(variable.id, e)}
                    className="absolute top-3 right-3 text-gray-500 dark:text-gray-500 hover:text-warning-red transition-colors text-lg leading-none"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ========================================
            WISHLIST FUNCTIONALITY (COMMENTED OUT)
            TO RESTORE: Uncomment this section and
            remove Warning/Action Items sections
            ========================================

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
                            {variable.name}
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

        ========================================
        END WISHLIST FUNCTIONALITY
        ======================================== */}
      </nav>

      {/* User Section */}
      <div className="p-6">
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Logged in as</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
            {username}
          </p>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between bg-gray-200 dark:bg-gray-900 hover:bg-gray-300 dark:hover:bg-medium-purple text-gray-900 dark:text-white font-medium py-3 px-4 rounded-lg transition-colors mb-3"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <span className="flex items-center gap-2">
            {isDarkMode ? (
              <>
                <span className="text-xl">🌙</span>
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <span className="text-xl">☀️</span>
                <span>Light Mode</span>
              </>
            )}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">Toggle</span>
        </button>

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
    </>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;
