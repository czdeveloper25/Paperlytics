import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { generateHistoricalData } from '../data/processVariables';
import { useSCTService } from '../context/SCTContext';

const MiniChart = React.memo(({ variable }) => {
  // Get SCT service ONLY (not current value) - prevents re-renders every 4s
  const sctService = variable.useLiveData && variable.dataSource === 'sct' ? useSCTService() : null;

  // Generate 24-hour data for the mini chart
  const chartData = useMemo(() => {
    // Use CSV data for SCT variable
    if (variable.useLiveData && variable.dataSource === 'sct' && sctService) {
      return sctService.getHistoricalData(24); // Last 24 points from CSV
    }
    // Use generated data for other variables
    return generateHistoricalData(variable, 'Day', 'normal');
  }, [variable.id, sctService]); // Depend on ID only for stability

  // Determine current status based on last value
  const currentStatus = useMemo(() => {
    if (!chartData || chartData.length === 0) return 'normal';
    const lastDataPoint = chartData[chartData.length - 1];
    return lastDataPoint.status;
  }, [chartData]);

  // Line color based on status
  const lineColor = currentStatus === 'warning' ? '#ff4444' : '#00ff88';

  return (
    <div className="w-full h-20 mb-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          {/* Upper threshold line */}
          <ReferenceLine
            y={variable.upperThreshold}
            stroke="#00ff88"
            strokeDasharray="3 3"
            strokeOpacity={0.3}
            strokeWidth={1}
          />

          {/* Lower threshold line */}
          <ReferenceLine
            y={variable.lowerThreshold}
            stroke="#ff4444"
            strokeDasharray="3 3"
            strokeOpacity={0.3}
            strokeWidth={1}
          />

          {/* Main data line */}
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

MiniChart.displayName = 'MiniChart';

export default MiniChart;
