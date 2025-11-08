import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSCTCurrentValue } from '../context/SCTContext';
import MiniChart from './MiniChart';

/**
 * Isolated SCT Card Component
 * Only this component re-renders when SCT live data updates
 * Uses useSCTCurrentValue() for optimal performance
 */
const SCTCard = React.memo(({ variable }) => {
  const navigate = useNavigate();
  const sctValue = useSCTCurrentValue(); // Only subscribe to current value

  const handleCardClick = () => {
    navigate(`/analytics/${variable.id}`);
  };

  // Use live SCT data
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

      {/* Mini Chart - 24 Hour Trend */}
      <MiniChart variable={variable} />

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
});

SCTCard.displayName = 'SCTCard';

export default SCTCard;
