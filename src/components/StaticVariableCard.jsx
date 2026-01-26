import React, { useState, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleMiniChart from './SimpleMiniChart';
import { ChartIcon, WarningFilledIcon } from './Icons';

/**
 * Static Variable Card Component
 * Optimized for performance:
 * - Custom memo comparison to prevent unnecessary re-renders
 * - No per-card event listeners (uses onBlur instead)
 * - Auto-refreshes every 30 seconds (app-wide)
 */
const StaticVariableCard = memo(({
  variable,
  // Pre-computed values passed from parent
  displayValue,
  status,
  lastUpdated
}) => {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef(null);

  const handleCardClick = useCallback(() => {
    navigate(`/analytics/${variable.id}`);
  }, [navigate, variable.id]);

  const handleSettingsClick = useCallback((e) => {
    e.stopPropagation();
    setShowSettings(prev => !prev);
  }, []);

  // Close settings on blur (no document event listener needed)
  const handleSettingsBlur = useCallback((e) => {
    // Check if focus moved outside the settings container
    if (settingsRef.current && !settingsRef.current.contains(e.relatedTarget)) {
      setShowSettings(false);
    }
  }, []);

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white dark:bg-gray-900 rounded-xl p-5 border-2 transition-all duration-200 hover:shadow-lg cursor-pointer ${
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
            {/* Settings Button - view details */}
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
                <ChartIcon className="w-4 h-4" />
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
              <WarningFilledIcon className="w-5 h-5 text-warning-red" />
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
            Updated: {lastUpdated}
          </p>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these specific props change
  return (
    prevProps.variable.id === nextProps.variable.id &&
    prevProps.displayValue === nextProps.displayValue &&
    prevProps.status === nextProps.status &&
    prevProps.lastUpdated === nextProps.lastUpdated
  );
});

StaticVariableCard.displayName = 'StaticVariableCard';

export default StaticVariableCard;
