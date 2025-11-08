import React from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateStatus } from '../utils/statusCalculator';
import SimpleMiniChart from './SimpleMiniChart';

/**
 * Static Variable Card Component
 * Memoized to prevent re-renders when SCT live data updates
 * Used for all non-live variables (65 out of 66)
 */
const StaticVariableCard = ({ variable }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/analytics/${variable.id}`);
  };

  const status = calculateStatus(variable);
  const displayValue = variable.lastValue;

  return (
    <div
      onClick={handleCardClick}
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
            {variable.name}
          </h3>
          {status === 'warning' && (
            <span className="ml-2 text-warning-red text-lg">⚠️</span>
          )}
        </div>
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
};

// Memoize with custom comparison - only re-render if variable ID changes
export default React.memo(StaticVariableCard, (prevProps, nextProps) => {
  return prevProps.variable.id === nextProps.variable.id;
});
