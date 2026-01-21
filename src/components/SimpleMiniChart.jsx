import React, { useMemo } from 'react';
import { generateHistoricalData } from '../data/processVariables';

/**
 * Lightweight Mini Chart Component
 * Uses simple SVG path instead of Recharts for better performance
 * Perfect for static cards that don't need complex chart features
 */
const SimpleMiniChart = ({ variable }) => {
  // Generate chart data
  const chartData = useMemo(() => {
    return generateHistoricalData(variable, 'Day', 'normal');
  }, [variable]); // Depend on full variable object

  // Calculate SVG path and metadata
  const { path, strokeColor } = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { path: '', strokeColor: '#00ff88' };
    }

    // Get value range for scaling
    const values = chartData.map(d => d.value);
    const minValue = Math.min(...values, variable.lowerThreshold);
    const maxValue = Math.max(...values, variable.upperThreshold);
    const valueRange = maxValue - minValue || 1; // Avoid division by zero

    // SVG dimensions
    const width = 100;
    const height = 100;
    const padding = 5;

    // Calculate points for SVG path
    const points = chartData.map((point, index) => {
      const x = padding + ((width - 2 * padding) * index) / (chartData.length - 1);
      const y = height - padding - ((height - 2 * padding) * (point.value - minValue)) / valueRange;
      return { x, y, value: point.value };
    });

    // Create SVG path
    const pathString = points.reduce((acc, point, index) => {
      if (index === 0) {
        return `M ${point.x},${point.y}`;
      }
      return `${acc} L ${point.x},${point.y}`;
    }, '');

    // Determine status from last value
    const lastValue = values[values.length - 1];
    const status = (lastValue > variable.upperThreshold || lastValue < variable.lowerThreshold)
      ? 'warning'
      : 'normal';
    const color = status === 'warning' ? '#ff4444' : '#00ff88';

    return { path: pathString, strokeColor: color };
  }, [chartData, variable.upperThreshold, variable.lowerThreshold]);

  // Calculate threshold positions for reference lines
  const thresholdPositions = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { upper: 0, lower: 0 };
    }

    const values = chartData.map(d => d.value);
    const minValue = Math.min(...values, variable.lowerThreshold);
    const maxValue = Math.max(...values, variable.upperThreshold);
    const valueRange = maxValue - minValue || 1;

    const height = 100;
    const padding = 5;

    const upperY = height - padding - ((height - 2 * padding) * (variable.upperThreshold - minValue)) / valueRange;
    const lowerY = height - padding - ((height - 2 * padding) * (variable.lowerThreshold - minValue)) / valueRange;

    return { upper: upperY, lower: lowerY };
  }, [chartData, variable.upperThreshold, variable.lowerThreshold]);

  return (
    <div className="w-full h-20 mb-3">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        {/* Upper threshold line */}
        <line
          x1="5"
          y1={thresholdPositions.upper}
          x2="95"
          y2={thresholdPositions.upper}
          stroke="#00ff88"
          strokeWidth="0.5"
          strokeDasharray="2 2"
          opacity="0.3"
        />

        {/* Lower threshold line */}
        <line
          x1="5"
          y1={thresholdPositions.lower}
          x2="95"
          y2={thresholdPositions.lower}
          stroke="#ff4444"
          strokeWidth="0.5"
          strokeDasharray="2 2"
          opacity="0.3"
        />

        {/* Data line */}
        <path
          d={path}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
};

SimpleMiniChart.displayName = 'SimpleMiniChart';

// Custom comparison function - only re-render if variable ID changes
const areEqual = (prevProps, nextProps) => {
  return prevProps.variable.id === nextProps.variable.id;
};

export default React.memo(SimpleMiniChart, areEqual);
