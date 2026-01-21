import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSCTCurrentValue } from '../context/SCTContext';
import { useRefreshContext } from '../context/VariableRefreshContext';
import MiniChart from './MiniChart';

/**
 * Isolated SCT Card Component
 * Only this component re-renders when SCT live data updates
 * Uses useSCTCurrentValue() for optimal performance
 *
 * Features:
 * - Auto-updates every 60s from SCTContext (existing functionality)
 * - Manual refresh button
 * - View details popup (consistent with StaticVariableCard)
 * - "Last updated" timestamp
 * - Loading state during refresh
 */
const SCTCard = React.memo(({ variable, isPinned, onTogglePin, isSelected, onToggleSelect }) => {
  const navigate = useNavigate();
  const sctValue = useSCTCurrentValue(); // Auto-update subscription

  // Manual refresh functionality
  const {
    refreshVariable,
    getLastUpdatedText,
    isLoading
  } = useRefreshContext();

  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef(null);

  const handleCardClick = useCallback(() => {
    navigate(`/analytics/${variable.id}`);
  }, [navigate, variable.id]);

  const handleRefreshClick = useCallback((e) => {
    e.stopPropagation();
    refreshVariable(variable.id);
  }, [refreshVariable, variable.id]);

  const handleSettingsClick = useCallback((e) => {
    e.stopPropagation();
    setShowSettings(prev => !prev);
  }, []);

  // Close settings on blur (no document event listener needed)
  const handleSettingsBlur = useCallback((e) => {
    if (settingsRef.current && !settingsRef.current.contains(e.relatedTarget)) {
      setShowSettings(false);
    }
  }, []);

  // Use live SCT data (from auto-update context)
  const displayValue = sctValue
    ? `${sctValue.value} ${variable.unit}`
    : variable.lastValue;

  // Calculate status using live value
  let status = 'normal';
  if (sctValue) {
    const numValue = parseFloat(sctValue.value);
    status = (numValue > variable.upperThreshold || numValue < variable.lowerThreshold)
      ? 'warning'
      : 'normal';
  }

  const loading = isLoading(variable.id);
  const lastUpdated = getLastUpdatedText(variable.id);

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white dark:bg-gray-900 rounded-xl p-5 border-2 transition-all duration-200 hover:shadow-lg cursor-pointer ${
        isSelected
          ? 'border-success-green ring-2 ring-success-green/30'
          : status === 'warning'
            ? 'border-warning-red'
            : 'border-gray-300 dark:border-transparent hover:border-gray-400 dark:hover:border-gray-600'
      }`}
    >
      {/* Variable Header */}
      <div className="mb-3">
        <div className="flex items-start justify-between mb-2">
          {/* Checkbox for selection */}
          <button
            onClick={(e) => onToggleSelect(variable.id, e)}
            className={`flex-shrink-0 w-5 h-5 rounded border-2 mr-2 mt-0.5 flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-success-green border-success-green text-white'
                : 'border-gray-400 dark:border-gray-500 hover:border-success-green'
            }`}
            title={isSelected ? 'Deselect variable' : 'Select for comparison'}
          >
            {isSelected && <span className="text-xs">✓</span>}
          </button>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight flex-1">
            {variable.name}
          </h3>
          <div className="flex items-center gap-1.5 ml-2">
            {/* Pin Button */}
            <button
              onClick={(e) => onTogglePin(variable.id, e)}
              className={`p-1.5 rounded-lg transition-all ${
                isPinned
                  ? 'bg-success-green text-white shadow-lg shadow-success-green/50 ring-2 ring-success-green'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              title={isPinned ? 'Unpin variable' : 'Pin to top'}
            >
              <span className="text-sm">{isPinned ? '📌' : '📍'}</span>
            </button>
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

            {/* View Details Button */}
            <div
              className="relative"
              ref={settingsRef}
              onBlur={handleSettingsBlur}
              tabIndex={-1}
            >
              <button
                onClick={handleSettingsClick}
                className="p-1.5 rounded-lg transition-all bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                title="View details"
              >
                <span className="text-sm">📊</span>
              </button>

              {/* Quick Info Popup */}
              {showSettings && (
                <div
                  className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-300 dark:border-gray-600 z-50 min-w-[180px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-3">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {variable.shortName}
                    </p>
                    <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Current:</span>
                        <span className={status === 'warning' ? 'text-warning-red font-medium' : 'text-success-green font-medium'}>
                          {displayValue}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Upper:</span>
                        <span>{variable.upperThreshold} {variable.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lower:</span>
                        <span>{variable.lowerThreshold} {variable.unit}</span>
                      </div>
                      {lastUpdated && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-gray-500">Updated: {lastUpdated}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleCardClick}
                      className="w-full mt-3 px-3 py-2 bg-success-green hover:bg-green-600 text-white rounded text-xs font-medium transition-colors"
                    >
                      View Analytics →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {status === 'warning' && (
              <span className="text-warning-red text-lg">⚠️</span>
            )}
          </div>
        </div>
      </div>

      {/* Current Value */}
      <div className="mb-3">
        <p className={`text-2xl font-bold transition-colors duration-300 ${
          status === 'warning' ? 'text-warning-red' : 'text-success-green'
        }`}>
          {displayValue}
        </p>
      </div>

      {/* Mini Chart - 24 Hour Trend */}
      <MiniChart variable={variable} />

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
            Updated: {lastUpdated}
          </p>
        </div>
      )}
    </div>
  );
});

SCTCard.displayName = 'SCTCard';

export default SCTCard;
