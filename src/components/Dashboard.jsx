import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { processVariables, processes } from '../data/processVariables';
import { calculateStatus, getWarningReason } from '../utils/statusCalculator';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' or 'errors'
  const [selectedProcess, setSelectedProcess] = useState(null); // Process filter
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Get warning variables with dynamic status calculation
  const warningVariables = useMemo(() => {
    return processVariables.filter(variable => calculateStatus(variable) === 'warning');
  }, []);

  const warningCount = warningVariables.length;

  // Filter variables based on search, filter mode, and process
  const filteredVariables = useMemo(() => {
    let filtered = processVariables;

    // Apply filter mode with dynamic status calculation
    if (filterMode === 'errors') {
      filtered = filtered.filter(variable => calculateStatus(variable) === 'warning');
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
  }, [searchQuery, filterMode, selectedProcess]);

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
                                {variable.shortName}
                              </h4>
                              <p className="text-gray-300 text-xs mb-1">
                                Current: {variable.lastValue} ({getWarningReason(variable)})
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
              const status = calculateStatus(variable);
              return (
              <div
                key={variable.id}
                onClick={() => handleCardClick(variable)}
                className={`bg-card-bg rounded-lg p-5 border-2 transition-all hover:shadow-lg hover:scale-105 cursor-pointer ${
                  status === 'warning'
                    ? 'border-warning-red'
                    : 'border-transparent hover:border-medium-purple'
                }`}
              >
                {/* Variable Header */}
                <div className="mb-3">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white text-sm leading-tight flex-1">
                      {variable.shortName}
                    </h3>
                    {status === 'warning' && (
                      <span className="ml-2 text-warning-red text-lg">⚠️</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2" title={variable.name}>
                    {variable.name}
                  </p>
                </div>

                {/* Current Value */}
                <div className="mb-4">
                  <p className={`text-2xl font-bold ${
                    status === 'warning' ? 'text-warning-red' : 'text-success-green'
                  }`}>
                    {variable.lastValue}
                  </p>
                </div>

                {/* Process Tags - Now Clickable */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {variable.processes.slice(0, 3).map((process, index) => (
                    <button
                      key={index}
                      onClick={(e) => handleProcessClick(process, e)}
                      className={`text-white text-xs px-2 py-1 rounded transition-all hover:ring-2 hover:ring-success-green ${
                        selectedProcess === process
                          ? 'bg-success-green text-deep-navy font-bold'
                          : 'bg-light-purple hover:bg-medium-purple'
                      }`}
                    >
                      {process}
                    </button>
                  ))}
                  {variable.processes.length > 3 && (
                    <span className="bg-medium-purple text-white text-xs px-2 py-1 rounded">
                      +{variable.processes.length - 3}
                    </span>
                  )}
                </div>

                {/* Thresholds */}
                <div className="text-xs text-gray-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Upper:</span>
                    <span>{variable.upperThreshold} {variable.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lower:</span>
                    <span>{variable.lowerThreshold} {variable.unit}</span>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
