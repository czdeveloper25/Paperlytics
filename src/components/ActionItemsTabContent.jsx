import React, { memo } from 'react';
import { getWarningType } from '../utils/statusCalculator';

const ActionItemsTabContent = memo(({
  activeWarnings,
  dismissedCount,
  onDismiss,
  onClearDismissed,
  onViewAnalytics,
  sctValue,
  refreshedValues
}) => {
  if (activeWarnings.length === 0) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 p-12 rounded-xl text-center border border-success-green">
        <span className="text-6xl mb-4 block">✓</span>
        <h2 className="text-2xl font-bold text-success-green mb-2">All Actions Completed</h2>
        <p className="text-gray-600 dark:text-gray-400">
          {dismissedCount > 0
            ? `${dismissedCount} item(s) dismissed`
            : 'No corrective actions required at this time'}
        </p>
        {dismissedCount > 0 && (
          <button
            onClick={onClearDismissed}
            className="mt-4 px-6 py-3 bg-medium-purple hover:bg-light-purple text-white rounded-xl transition-all font-medium"
          >
            Restore All ({dismissedCount})
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Action Items</h1>
        <div className="flex items-center gap-4">
          <p className="text-gray-400">{activeWarnings.length} action(s) required</p>
          {dismissedCount > 0 && (
            <button
              onClick={onClearDismissed}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-success-green transition-colors"
            >
              Restore {dismissedCount} dismissed
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {activeWarnings.map((variable) => {
          const warningType = getWarningType(variable, sctValue, refreshedValues);

          return (
            <div
              key={variable.id}
              className="bg-gray-100 dark:bg-gray-900 p-6 rounded-xl border border-warning-red relative group"
            >
              <button
                onClick={() => onViewAnalytics(variable.id)}
                className="w-full text-left pr-10"
              >
                <div className="flex items-start gap-4">
                  <span className="text-warning-red text-3xl flex-shrink-0">⚠️</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-success-green transition-colors">
                        {variable.shortName}
                      </h3>
                      <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                        warningType === 'High Warning'
                          ? 'bg-warning-red/20 text-warning-red'
                          : 'bg-orange-400/20 text-orange-400'
                      }`}>
                        {warningType}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">{variable.name}</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      Current: <span className="font-medium">{variable.lastValue}</span>
                      <span className="mx-2">|</span>
                      Range: {variable.lowerThreshold} - {variable.upperThreshold} {variable.unit}
                    </p>
                    <p className="text-success-green text-sm font-medium group-hover:underline">
                      Click for detailed action steps →
                    </p>
                  </div>
                </div>
              </button>

              {/* Dismiss Button */}
              <button
                onClick={(e) => onDismiss(variable.id, e)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-warning-red hover:bg-warning-red/10 rounded-lg transition-all text-xl"
                title="Dismiss this action item"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
});

ActionItemsTabContent.displayName = 'ActionItemsTabContent';

export default ActionItemsTabContent;
