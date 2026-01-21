import React, { memo } from 'react';
import { getWarningType, getCurrentDisplayValue } from '../utils/statusCalculator';

const WarningTabContent = memo(({
  warningVariables,
  sctValue,
  refreshedValues,
  onViewAnalytics
}) => {
  if (warningVariables.length === 0) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 p-12 rounded-xl text-center">
        <span className="text-6xl mb-4 block">✓</span>
        <h2 className="text-2xl font-bold text-success-green mb-2">All Systems Normal</h2>
        <p className="text-gray-600 dark:text-gray-400">No warnings detected across all process variables</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Warning Items</h1>
        <p className="text-gray-400">{warningVariables.length} variable(s) require attention</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {warningVariables.map((variable) => {
          const warningType = getWarningType(variable, sctValue, refreshedValues);
          const isHighWarning = warningType === 'High Warning';
          const currentValue = getCurrentDisplayValue(variable, sctValue, refreshedValues);

          return (
            <button
              key={variable.id}
              onClick={() => onViewAnalytics(variable.id)}
              className="bg-gray-100 dark:bg-gray-900 p-6 rounded-xl text-left hover:bg-gray-200 dark:hover:bg-[#252464] transition-all border-l-4 border-warning-red group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-warning-red transition-colors">
                  {variable.shortName}
                </h3>
                <span className="text-warning-red text-2xl">⚠️</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{variable.name}</p>
              <p className="text-gray-700 dark:text-gray-300 mb-2 font-medium">{currentValue}</p>
              <p className={`text-sm font-medium ${isHighWarning ? 'text-warning-red' : 'text-orange-400'}`}>
                {warningType}
              </p>
              <div className="flex flex-wrap gap-1 mt-3">
                {variable.processes.slice(0, 3).map((process, idx) => (
                  <span key={idx} className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                    {process}
                  </span>
                ))}
                {variable.processes.length > 3 && (
                  <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                    +{variable.processes.length - 3}
                  </span>
                )}
              </div>
              <p className="text-xs text-success-green mt-3 group-hover:underline">
                Click for details and action steps →
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
});

WarningTabContent.displayName = 'WarningTabContent';

export default WarningTabContent;
