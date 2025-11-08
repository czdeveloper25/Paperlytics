import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { processVariables, processes } from '../data/processVariables';
import { calculateStatus, getWarningReason } from '../utils/statusCalculator';
import { useSCTCurrentValue } from '../context/SCTContext';
import SCTCard from './SCTCard';
import StaticVariableCard from './StaticVariableCard';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' or 'errors'
  const [selectedProcess, setSelectedProcess] = useState(null); // Process filter
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Get ONLY live SCT data (for variable ID 2)
  const sctValue = useSCTCurrentValue();

  // Get warning variables - STATIC except for SCT
  const warningVariables = useMemo(() => {
    return processVariables.filter(variable => {
      // For SCT variable (ID: 2), use live data
      if (variable.id === 2 && variable.useLiveData && variable.dataSource === 'sct' && sctValue) {
        const numValue = parseFloat(sctValue.value);
        return (numValue > variable.upperThreshold || numValue < variable.lowerThreshold);
      }
      // For all other variables, use static calculation (NO RELOAD)
      return calculateStatus(variable) === 'warning';
    });
  }, [sctValue]); // Only re-compute when SCT changes

  const warningCount = warningVariables.length;

  // Filter variables based on search, filter mode, and process
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

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(variable =>
        variable.name.toLowerCase().includes(query) ||
        variable.shortName.toLowerCase().includes(query) ||
        variable.processes.some(process => process.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [warningVariables, searchQuery, filterMode, selectedProcess]);

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

  const handleCardClick = (variable) => {
    navigate(`/analytics/${variable.id}`);
  };

  const handleProcessClick = (process, e) => {
    e.stopPropagation(); // Prevent card click
    setSelectedProcess(process);
  };

  const clearProcessFilter = () => {
    setSelectedProcess(null);
  };

  // Get timestamp (mock for now)
  const getTimestamp = () => {
    const now = new Date();
    const minutes = Math.floor(Math.random() * 30); // Random minutes ago
    const date = new Date(now.getTime() - minutes * 60000);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  return (
    <div className="min-h-screen bg-deep-navy text-white">
      {/* Top Bar - Sticky */}
      <div className="sticky top-0 bg-deep-navy z-10 border-b border-medium-purple h-[84px] flex items-center">
        <div className="px-8 w-full">
          <div className="flex items-center justify-center gap-6">
            {/* Search Bar - Center */}
            <div className="flex-1 max-w-2xl">
              <input
                type="text"
                placeholder="Search processes or variables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#252464] text-white placeholder-gray-400 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-medium-purple transition-all"
              />
            </div>

            {/* Filter Toggle Button - Middle */}
            <button
              onClick={toggleFilter}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                filterMode === 'errors'
                  ? 'bg-warning-red hover:bg-red-600 text-white'
                  : 'bg-medium-purple hover:bg-light-purple text-white'
              }`}
            >
              {filterMode === 'all' ? 'Show All' : 'Show Errors Only'}
            </button>

            {/* Notification Bell - Right */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={toggleNotifications}
                className="relative p-3 bg-medium-purple hover:bg-light-purple rounded-lg transition-all"
              >
                <span className="text-2xl">🔔</span>
                {warningCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-warning-red text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                    {warningCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-[350px] bg-card-bg rounded-lg shadow-2xl border border-medium-purple overflow-hidden animate-fadeIn">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-medium-purple">
                    <h3 className="text-white font-bold">
                      Notifications ({warningCount})
                    </h3>
                  </div>

                  {/* Notification Items */}
                  <div className="max-h-[400px] overflow-y-auto">
                    {warningVariables.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <p className="text-gray-400">No active warnings</p>
                      </div>
                    ) : (
                      warningVariables.map((variable, index) => (
                        <div
                          key={variable.id}
                          className={`px-4 py-3 hover:bg-[#252464] transition-colors ${
                            index < warningVariables.length - 1 ? 'border-b border-medium-purple' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3 mb-2">
                            <span className="text-warning-red text-xl flex-shrink-0">⚠️</span>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-bold text-sm mb-1">
                                {variable.name}
                              </h4>
                              <p className="text-gray-300 text-xs mb-1">
                                Current: {variable.id === 2 && sctValue ? `${sctValue.value} ${variable.unit}` : variable.lastValue} ({
                                  variable.id === 2 && sctValue
                                    ? (parseFloat(sctValue.value) > variable.upperThreshold ? 'High Warning' : 'Low Warning')
                                    : getWarningReason(variable)
                                })
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

      {/* Main Content Area */}
      <div className="p-8">
        {/* Header with Title and Variable Count */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-400">
            Showing {filteredVariables.length} of {processVariables.length} variables
          </p>
        </div>

        {/* Process Filter Buttons */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={clearProcessFilter}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !selectedProcess
                  ? 'bg-success-green text-deep-navy'
                  : 'bg-card-bg text-gray-300 hover:bg-medium-purple hover:text-white'
              }`}
            >
              All Processes
            </button>
            {processes.map((process) => (
              <button
                key={process}
                onClick={() => setSelectedProcess(process)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedProcess === process
                    ? 'bg-success-green text-deep-navy'
                    : 'bg-card-bg text-gray-300 hover:bg-medium-purple hover:text-white'
                }`}
              >
                {process}
              </button>
            ))}
          </div>
        </div>

        {/* Variable Cards Grid */}
        {filteredVariables.length === 0 ? (
          <div className="bg-card-bg p-8 rounded-lg text-center">
            <p className="text-gray-300 text-lg">No variables found</p>
            <p className="text-sm text-gray-400 mt-2">
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
                return <SCTCard key={variable.id} variable={variable} />;
              } else {
                // All other variables - memoized, won't re-render on SCT updates
                return <StaticVariableCard key={variable.id} variable={variable} />;
              }
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
