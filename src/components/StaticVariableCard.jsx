import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateStatus } from '../utils/statusCalculator';
import SimpleMiniChart from './SimpleMiniChart';
import { useRefreshContext } from '../context/VariableRefreshContext';
import {
  useVariableAutoRefresh,
  useAutoRefreshSettings,
  REFRESH_INTERVALS,
  getIntervalLabel
} from '../hooks/useVariableAutoRefresh';

/**
 * Static Variable Card Component
 * Memoized to prevent re-renders when SCT live data updates
 * Used for all non-live variables (65 out of 66)
 *
 * Features:
 * - Manual refresh button (🔄)
 * - Auto-refresh toggle with settings popup (⚙️)
 * - "Last updated" timestamp
 * - Loading state during refresh
 */
const StaticVariableCard = ({ variable }) => {
  const navigate = useNavigate();
  const {
    refreshVariable,
    getVariableValue,
    getVariableStatus,
    getLastUpdatedText,
    isLoading
  } = useRefreshContext();

  // Auto-refresh settings
  const { getAutoRefresh, setAutoRefresh } = useAutoRefreshSettings();
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef(null);

  const currentInterval = getAutoRefresh(variable.id);

  // Setup auto-refresh if enabled
  useVariableAutoRefresh(variable.id, currentInterval, refreshVariable);

  const handleCardClick = () => {
    navigate(`/analytics/${variable.id}`);
  };

  const handleRefreshClick = (e) => {
    e.stopPropagation();
    refreshVariable(variable.id);
  };

  const handleSettingsClick = (e) => {
    e.stopPropagation();
    setShowSettings(prev => !prev);
  };

  const handleIntervalSelect = (interval, e) => {
    e.stopPropagation();
    setAutoRefresh(variable.id, interval);
    setShowSettings(false);
  };

  // Click outside to close settings
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };

    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  const status = getVariableStatus(variable, calculateStatus(variable));
  const displayValue = getVariableValue(variable);
  const loading = isLoading(variable.id);
  const lastUpdated = getLastUpdatedText(variable.id);

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white dark:bg-gray-900 rounded-xl p-5 border-2 transition-all hover:shadow-lg hover:scale-105 cursor-pointer ${
        status === 'warning'
          ? 'border-warning-red'
          : 'border-gray-300 dark:border-transparent hover:border-gray-400 dark:hover:border-gray-600'
      }`}
    >
      {/* Variable Header */}
      <div className="mb-3">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight flex-1">
            {variable.name}
          </h3>
          <div className="flex items-center gap-1.5 ml-2">
            {/* Refresh Button */}
            <button
              onClick={handleRefreshClick}
              disabled={loading}
              className={`p-1.5 rounded-lg transition-all ${
                loading
                  ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              title="Refresh variable"
            >
              <span className={`text-sm ${loading ? 'animate-spin inline-block' : ''}`}>
                🔄
              </span>
            </button>

            {/* Settings Button (Auto-refresh) */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={handleSettingsClick}
                className={`p-1.5 rounded-lg transition-all ${
                  currentInterval
                    ? 'bg-success-green hover:bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                title="Auto-refresh settings"
              >
                <span className="text-sm">⚙️</span>
              </button>

              {/* Settings Popup */}
              {showSettings && (
                <div
                  className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-300 dark:border-gray-600 z-50 min-w-[160px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-3">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Auto-refresh
                    </p>
                    <div className="space-y-1">
                      {Object.entries(REFRESH_INTERVALS).map(([key, value]) => (
                        <button
                          key={key}
                          onClick={(e) => handleIntervalSelect(value, e)}
                          className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                            currentInterval === value
                              ? 'bg-success-green text-white font-medium'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {getIntervalLabel(value)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {status === 'warning' && (
              <span className="text-warning-red text-lg">⚠️</span>
            )}
          </div>
        </div>

        {/* Auto-refresh indicator */}
        {currentInterval && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-success-green">
              ● Auto: {getIntervalLabel(currentInterval)}
            </span>
          </div>
        )}
      </div>

      {/* Current Value */}
      <div className="mb-3">
        <p className={`text-2xl font-bold ${
          status === 'warning' ? 'text-warning-red' : 'text-success-green'
        }`}>
          {displayValue}
        </p>
      </div>

      {/* Mini Chart - 24 Hour Trend (Lightweight) */}
      <SimpleMiniChart variable={variable} />

      {/* Thresholds */}
      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
        <div className="flex justify-between">
          <span>Upper:</span>
          <span>{variable.upperThreshold} {variable.unit}</span>
        </div>
        <div className="flex justify-between">
          <span>Lower:</span>
          <span>{variable.lowerThreshold} {variable.unit}</span>
        </div>
      </div>

      {/* Last Updated Timestamp */}
      {lastUpdated && (
        <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Last updated: {lastUpdated}
          </p>
        </div>
      )}
    </div>
  );
};

// Memoize with custom comparison - only re-render if variable ID changes
export default React.memo(StaticVariableCard, (prevProps, nextProps) => {
  return prevProps.variable.id === nextProps.variable.id;
});
