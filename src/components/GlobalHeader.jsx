import React, { useMemo } from 'react';
import { processVariables } from '../data/processVariables';
import { useSCTCurrentValue } from '../context/SCTContext';
import { useRefreshContext } from '../context/VariableRefreshContext';
import { calculateStatus } from '../utils/statusCalculator';
import { useSidebar } from '../context/SidebarContext';
import { WarningFilledIcon, CheckIcon, RefreshIcon, MenuIcon } from './Icons';

const GlobalHeader = () => {
  // Get sidebar context for hamburger menu
  const { toggleSidebar } = useSidebar();

  // Get live SCT data
  const sctValue = useSCTCurrentValue();

  // Get refresh context for updated values
  const {
    getVariableValue,
    getVariableStatus,
    refreshVariable,
    getLastUpdatedText,
    isLoading
  } = useRefreshContext();

  // Get the 3 key variables
  const variables = useMemo(() => {
    return [
      processVariables.find(v => v.id === 1), // Machine Speed
      processVariables.find(v => v.id === 2), // SCT
      processVariables.find(v => v.id === 3), // Now BW
    ];
  }, []);

  // Check if any of the 3 variables are loading
  const isAnyLoading = variables.some(v => v && isLoading(v.id));

  // Get the most recent timestamp from the 3 variables
  const getMostRecentUpdate = () => {
    const timestamps = variables
      .filter(v => v)
      .map(v => getLastUpdatedText(v.id))
      .filter(t => t);

    if (timestamps.length === 0) return null;

    // Return the first one (they're all recent if refreshed together)
    return timestamps[0];
  };

  // Refresh all 3 header variables at once
  const handleRefreshAll = (e) => {
    e.stopPropagation();
    variables.forEach(variable => {
      if (variable) {
        refreshVariable(variable.id);
      }
    });
  };

  // Get display value and status for each variable
  const getVariableInfo = (variable) => {
    if (!variable) return { value: 'N/A', status: 'normal' };

    // For SCT (ID 2), use live data from context
    if (variable.id === 2 && sctValue) {
      return {
        value: `${sctValue.value} ${variable.unit}`,
        status: sctValue.status
      };
    }

    // For others (Machine Speed, Now BW), use refresh context
    // This will show refreshed values if they've been manually/auto-refreshed
    const displayValue = getVariableValue(variable);
    const status = getVariableStatus(variable, calculateStatus(variable));

    return {
      value: displayValue,
      status: status
    };
  };

  const lastUpdated = getMostRecentUpdate();

  return (
    <div className="sticky top-0 z-20 bg-white dark:bg-black px-4 md:px-8 py-4 shadow-sm border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-4">
        {/* Hamburger Menu Button - Mobile/Tablet Only */}
        <button
          data-hamburger
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg
            className="w-6 h-6 text-gray-900 dark:text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Variables Grid - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 flex-1">
          {variables.map((variable) => {
            if (!variable) return null;
            const info = getVariableInfo(variable);
            const isWarning = info.status === 'warning';

            return (
              <div
                key={variable.id}
                className="bg-gray-50 dark:bg-[#0a0a0a] px-4 py-3 rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 truncate">
                      {variable.shortName}
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
                      {info.value}
                    </p>
                  </div>
                  <span className={`ml-3 ${isWarning ? 'text-warning-red' : 'text-success-green'}`}>
                    {isWarning ? <WarningFilledIcon className="w-6 h-6" /> : <CheckIcon className="w-6 h-6" />}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* SCT Data Time & Refresh Button - Hide on mobile */}
        <div className="hidden md:flex ml-6 items-center gap-4">
          {/* Last Updated Display */}
          {sctValue && sctValue.csvTimestamp && (
            <div className="px-4 py-2 bg-gray-50 dark:bg-[#0a0a0a] rounded-xl shadow-md">
              <p className="text-xs text-gray-500 dark:text-gray-400">Last Updated</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {sctValue.csvTimestamp}
              </p>
            </div>
          )}

          {/* Refresh Button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleRefreshAll}
              disabled={isAnyLoading}
              className={`p-3 rounded-xl transition-all ${
                isAnyLoading
                  ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              title="Refresh all header variables"
            >
              <RefreshIcon className={`w-5 h-5 ${isAnyLoading ? 'animate-spin' : ''}`} />
            </button>
            {lastUpdated && (
              <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {lastUpdated} ago
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalHeader;
