import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { processVariables, processes } from '../data/processVariables';
import { getWarningType } from '../utils/statusCalculator';
import { useSCTCurrentValue } from '../context/SCTContext';
import { useRefreshContext } from '../context/VariableRefreshContext';
import SCTCard from './SCTCard';
import StaticVariableCard from './StaticVariableCard';
import ActionItemsTabContent from './ActionItemsTabContent';
import SearchWithAutocomplete from './SearchWithAutocomplete';
import { BellIcon, WarningFilledIcon, ChartIcon, TargetIcon } from './Icons';

// App auto-refreshes every 30 seconds - manual refresh removed

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' or 'errors'
  const [selectedProcess, setSelectedProcess] = useState(null); // Process filter
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Tab state - tracks which tab is active
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'warning' | 'action'

  // Dismissed action items state (persisted in localStorage)
  const [dismissedActions, setDismissedActions] = useState(() => {
    const stored = localStorage.getItem('dismissedActionItems');
    return stored ? JSON.parse(stored) : [];
  });


  // Get ONLY live SCT data (for variable ID 2)
  const sctValue = useSCTCurrentValue();

  // Get refresh context for auto-refresh values
  const { refreshedValues, getLastUpdatedText } = useRefreshContext();

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

  const warningCount = warningVariables.length;

  // Active warnings (filtered by dismissed) for Action Items tab
  const activeWarnings = useMemo(() => {
    return warningVariables.filter(v => !dismissedActions.includes(v.id));
  }, [warningVariables, dismissedActions]);

  // Parse comma-separated search into individual terms
  const searchTerms = useMemo(() => {
    return searchQuery.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  }, [searchQuery]);

  // Filter variables based on search, filter mode, process, and selection
  const filteredVariables = useMemo(() => {
    let filtered = processVariables;

    // Apply filter mode - show only warnings
    if (filterMode === 'errors') {
      filtered = warningVariables;
    }

    // Apply process filter
    if (selectedProcess) {
      filtered = filtered.filter(variable =>
        variable.processes.includes(selectedProcess)
      );
    }

    // Apply comma-separated search query (match ANY term)
    if (searchTerms.length > 0) {
      filtered = filtered.filter(variable =>
        searchTerms.some(term =>
          variable.name.toLowerCase().includes(term) ||
          variable.shortName.toLowerCase().includes(term) ||
          variable.processes.some(process => process.toLowerCase().includes(term))
        )
      );
    }

    return filtered;
  }, [warningVariables, searchTerms, filterMode, selectedProcess]);


  const toggleFilter = () => {
    setFilterMode(prev => prev === 'all' ? 'errors' : 'all');
  };

  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
  };

  const handleViewAnalytics = (variable) => {
    setShowNotifications(false);
    navigate(`/analytics/${variable.id}`);
  };

  const clearProcessFilter = () => {
    setSelectedProcess(null);
  };


  // Handler to dismiss an action item
  const handleDismiss = (variableId, e) => {
    e.stopPropagation();
    const updated = [...dismissedActions, variableId];
    setDismissedActions(updated);
    localStorage.setItem('dismissedActionItems', JSON.stringify(updated));
  };

  // Handler to restore all dismissed items
  const clearDismissed = () => {
    setDismissedActions([]);
    localStorage.removeItem('dismissedActionItems');
  };

  // Use shared getWarningType utility - call with sctValue and refreshedValues
  const getWarningTypeForVariable = (variable) => getWarningType(variable, sctValue, refreshedValues);

  // Get timestamp (mock for now)
  const getTimestamp = () => {
    const now = new Date();
    const minutes = Math.floor(Math.random() * 30); // Random minutes ago
    const date = new Date(now.getTime() - minutes * 60000);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };


  // Memoized click outside handler
  const handleClickOutside = useCallback((event) => {
    if (notificationRef.current && !notificationRef.current.contains(event.target)) {
      setShowNotifications(false);
    }
  }, []);

  // Click outside effect with memoized handler
  useEffect(() => {
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNotifications, handleClickOutside]);

  // Auto-cleanup: Remove dismissed items that are no longer warnings
  useEffect(() => {
    const currentWarningIds = warningVariables.map(v => v.id);
    const stillWarnings = dismissedActions.filter(id => currentWarningIds.includes(id));
    if (stillWarnings.length !== dismissedActions.length) {
      setDismissedActions(stillWarnings);
      localStorage.setItem('dismissedActionItems', JSON.stringify(stillWarnings));
    }
  }, [warningVariables, dismissedActions]);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      {/* Top Bar - Responsive */}
      <div className="bg-white dark:bg-black py-4 px-4 md:px-8">
        <div className="w-full">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
            {/* Search Bar with Autocomplete - Full width on mobile */}
            <div className="flex-1 md:max-w-2xl">
              <SearchWithAutocomplete
                value={searchQuery}
                onChange={setSearchQuery}
                suggestions={processVariables}
                placeholder="Search variables..."
              />
            </div>

            {/* Action Buttons - Stack on mobile, row on tablet+ */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              {/* Filter Toggle Button */}
              <button
                onClick={toggleFilter}
                className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-medium transition-all text-sm md:text-base whitespace-nowrap ${
                  filterMode === 'errors'
                    ? 'bg-warning-red hover:bg-red-600 text-white'
                    : 'bg-gray-200 dark:bg-medium-purple hover:bg-gray-300 dark:hover:bg-light-purple text-gray-900 dark:text-white'
                }`}
              >
                <span className="hidden sm:inline">{filterMode === 'all' ? 'Show All' : 'Show Errors Only'}</span>
                <span className="sm:hidden">{filterMode === 'all' ? 'All' : 'Errors'}</span>
              </button>

              {/* Notification Bell - Right */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={toggleNotifications}
                  className="relative p-2 md:p-3 bg-gray-200 dark:bg-medium-purple hover:bg-gray-300 dark:hover:bg-light-purple rounded-xl transition-all"
                >
                  <BellIcon className="w-5 h-5 md:w-6 md:h-6" />
                  {warningCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-warning-red text-white text-xs font-bold rounded-full h-5 w-5 md:h-6 md:w-6 flex items-center justify-center">
                      {warningCount}
                    </span>
                  )}
                </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-[350px] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-300 dark:border-gray-700 overflow-hidden animate-fadeIn">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-300 dark:border-gray-700">
                    <h3 className="text-gray-900 dark:text-white font-bold">
                      Notifications ({warningCount})
                    </h3>
                  </div>

                  {/* Notification Items */}
                  <div className="max-h-[400px] overflow-y-auto">
                    {warningVariables.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <p className="text-gray-600 dark:text-gray-400">No active warnings</p>
                      </div>
                    ) : (
                      warningVariables.map((variable, index) => (
                        <div
                          key={variable.id}
                          className={`px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#252464] transition-colors ${
                            index < warningVariables.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3 mb-2">
                            <WarningFilledIcon className="w-5 h-5 text-warning-red flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-gray-900 dark:text-white font-bold text-sm mb-1">
                                {variable.name}
                              </h4>
                              <p className="text-gray-700 dark:text-gray-300 text-xs mb-1">
                                Current: {variable.id === 2 && sctValue ? `${sctValue.value} ${variable.unit}` : variable.lastValue} ({getWarningTypeForVariable(variable)})
                              </p>
                              <p className="text-gray-400 text-xs">
                                {getTimestamp()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleViewAnalytics(variable)}
                            className="w-full mt-2 bg-medium-purple hover:bg-light-purple text-white text-xs py-2 px-3 rounded transition-all"
                          >
                            View Analytics →
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Below sticky bar, above content - Responsive */}
      <div className="px-4 md:px-8 pt-4 bg-white dark:bg-black overflow-x-auto">
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 min-w-max md:min-w-0">
          {/* Dashboard Tab */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 font-medium transition-all border-b-2 -mb-px text-sm md:text-base whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'text-success-green border-success-green'
                : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <ChartIcon className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Dash</span>
          </button>

          {/* Action Items Tab */}
          <button
            onClick={() => setActiveTab('action')}
            className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 font-medium transition-all border-b-2 -mb-px text-sm md:text-base whitespace-nowrap ${
              activeTab === 'action'
                ? 'text-success-green border-success-green'
                : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <TargetIcon className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Action Items</span>
            <span className="sm:hidden">Actions</span>
            {activeWarnings.length > 0 && (
              <span className="bg-warning-red text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {activeWarnings.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area - Responsive Padding */}
      <div className="p-4 md:p-8">
        {/* Dashboard Tab Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* Header with Title and Variable Count - Responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
              <p className="text-gray-400 text-sm">
                Showing {filteredVariables.length} of {processVariables.length} variables
              </p>
            </div>

            {/* Process Filter Buttons */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={clearProcessFilter}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    !selectedProcess
                      ? 'bg-success-green text-deep-navy dark:text-deep-navy'
                      : 'bg-gray-200 dark:bg-gray-900 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-medium-purple hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  All Processes
                </button>
                {processes.map((process) => (
                  <button
                    key={process}
                    onClick={() => setSelectedProcess(process)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedProcess === process
                        ? 'bg-success-green text-deep-navy dark:text-deep-navy'
                        : 'bg-gray-200 dark:bg-gray-900 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-medium-purple hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {process}
                  </button>
                ))}
              </div>
            </div>

            {/* Variable Cards Grid */}
            {filteredVariables.length === 0 ? (
              <div className="bg-gray-100 dark:bg-gray-900 p-8 rounded-xl text-center">
                <p className="text-gray-700 dark:text-gray-300 text-lg">No variables found</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Try adjusting your search or filter
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredVariables.map((variable) => {
                  // Split rendering: SCT Card vs Static Cards
                  // This prevents all 66 cards from re-rendering when SCT updates
                  if (variable.useLiveData && variable.dataSource === 'sct') {
                    // SCT Variable - uses live context data, re-renders every 4 seconds
                    return (
                      <SCTCard
                        key={variable.id}
                        variable={variable}
                      />
                    );
                  } else {
                    // All other variables - memoized with pre-computed values
                    const refreshed = refreshedValues[variable.id];
                    const displayValue = refreshed ? refreshed.value : variable.lastValue;
                    const currentVal = parseFloat(refreshed?.value || variable.lastValue);
                    const status = (currentVal > variable.upperThreshold || currentVal < variable.lowerThreshold) ? 'warning' : 'normal';

                    return (
                      <StaticVariableCard
                        key={variable.id}
                        variable={variable}
                        displayValue={displayValue}
                        status={status}
                        lastUpdated={getLastUpdatedText(variable.id)}
                      />
                    );
                  }
                })}
              </div>
            )}
          </>
        )}

        {/* Action Items Tab Content */}
        {activeTab === 'action' && (
          <ActionItemsTabContent
            activeWarnings={activeWarnings}
            dismissedCount={dismissedActions.length}
            onDismiss={handleDismiss}
            onClearDismissed={clearDismissed}
            onViewAnalytics={(id) => navigate(`/analytics/${id}`)}
            sctValue={sctValue}
            refreshedValues={refreshedValues}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
