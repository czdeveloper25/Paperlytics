import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { processVariables, generateHistoricalData } from '../data/processVariables';
import { variableDefinitions } from '../data/variableDefinitions';
import { useWishlist } from '../context/WishlistContext';
// calculateStatus and getWarningReason removed - using local logic instead
import Toast from './Toast';
import { useSCTCurrentValue, useSCTService } from '../context/SCTContext';
import { useRefreshContext } from '../context/VariableRefreshContext';
import { getActionInstructions } from '../utils/actionInstructions';
import { useTheme } from '../context/ThemeContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea
} from 'recharts';

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, unit }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 p-3 rounded-xl shadow-xl">
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">{label}</p>
        <p className={`text-lg font-bold ${
          dataPoint.status === 'warning' ? 'text-warning-red' : 'text-success-green'
        }`}>
          {dataPoint.value} {unit}
        </p>
        <p className={`text-xs ${
          dataPoint.status === 'warning' ? 'text-warning-red' : 'text-success-green'
        }`}>
          {dataPoint.status === 'warning' ? '⚠️ Warning' : '✓ Normal'}
        </p>
      </div>
    );
  }
  return null;
};

const Analytics = () => {
  const { variableId } = useParams();
  const navigate = useNavigate();
  const { isInWishlist } = useWishlist();
  const { isDarkMode } = useTheme();

  // Find variable by ID
  const variable = useMemo(() => {
    return processVariables.find((v) => v.id === parseInt(variableId));
  }, [variableId]);

  // Always call hooks unconditionally (React rules of hooks)
  const sctCurrentValue = useSCTCurrentValue();
  const sctServiceMethods = useSCTService();
  const { refreshedValues } = useRefreshContext();

  // Determine if this is the SCT variable
  const isSCTVariable = variable?.useLiveData && variable?.dataSource === 'sct';

  // Use the hook values only if this is the SCT variable
  const sctValue = isSCTVariable ? sctCurrentValue : null;
  const sctService = isSCTVariable ? sctServiceMethods : null;

  // Modal and form state
  const [showModal, setShowModal] = React.useState(false);
  const [upperThreshold, setUpperThreshold] = React.useState('');
  const [lowerThreshold, setLowerThreshold] = React.useState('');
  const [validationError, setValidationError] = React.useState('');
  const [showToast, setShowToast] = React.useState(false);
  const [, setRefreshKey] = React.useState(0); // Force re-render after threshold update

  // Chart and data state
  const [timeRange, setTimeRange] = React.useState('Day'); // 'Hour', 'Day', 'Week', 'Month', 'Custom'
  const [dataSource, setDataSource] = React.useState('normal'); // 'normal' or 'abnormal'

  // Custom date range state
  const [customStartDate, setCustomStartDate] = React.useState('');
  const [customEndDate, setCustomEndDate] = React.useState('');
  const [showCustomRange, setShowCustomRange] = React.useState(false);

  // Wishlist toast state (reserved for future use)
  const [showWishlistToast, setShowWishlistToast] = React.useState(false);
  const [toastMessage] = React.useState('');

  // Initialize form values when modal opens
  React.useEffect(() => {
    if (showModal && variable) {
      setUpperThreshold(variable.upperThreshold.toString());
      setLowerThreshold(variable.lowerThreshold.toString());
      setValidationError('');
    }
  }, [showModal, variable]);

  // ESC key handler
  React.useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showModal]);

  // Dynamic chart colors based on theme - called unconditionally
  const chartColors = useMemo(() => {
    if (isDarkMode) {
      return {
        // Dark Mode Colors
        axisStroke: '#ffffff',
        axisTick: '#e5e7eb',        // gray-200 - readable on black
        axisLine: '#6b7280',         // gray-500
        gridLine: '#374151',         // gray-700 - subtle on black
        dataLine: '#3b82f6',         // blue-500 - vibrant
        dataDot: '#60a5fa',          // blue-400
        activeDot: '#fbbf24',        // amber-400
      };
    } else {
      return {
        // Light Mode Colors
        axisStroke: '#374151',       // gray-700
        axisTick: '#1f2937',         // gray-800 - READABLE on white
        axisLine: '#9ca3af',         // gray-400
        gridLine: '#d1d5db',         // gray-300 - subtle on white
        dataLine: '#2563eb',         // blue-600 - vibrant, good contrast
        dataDot: '#3b82f6',          // blue-500
        activeDot: '#f59e0b',        // amber-500
      };
    }
  }, [isDarkMode]);

  // Generate chart data based on selected time range and data source
  const chartData = useMemo(() => {
    if (!variable) return [];

    // Use CSV data for SCT variable
    if (variable.useLiveData && variable.dataSource === 'sct' && sctService) {
      const allData = sctService.getAllData(); // Stable service method

      // Filter based on time range
      switch (timeRange) {
        case 'Hour':
          return allData.slice(-60); // Last 60 minutes
        case 'Day':
          return allData; // All 1440 points (24 hours)
        case 'Week':
          // Sample every 10 minutes for week view (144 points)
          return allData.filter((_, i) => i % 10 === 0);
        case 'Month':
          // Sample every 30 minutes for month view (48 points)
          return allData.filter((_, i) => i % 30 === 0);
        case 'Custom':
          // For custom range, generate mock data since SCT timestamps don't have full dates
          if (customStartDate && customEndDate) {
            return generateHistoricalData(variable, 'Custom', 'normal', customStartDate, customEndDate);
          }
          return allData;
        default:
          return allData;
      }
    }

    // Use generated data for other variables
    // For custom range, generate appropriate data
    if (timeRange === 'Custom' && customStartDate && customEndDate) {
      return generateHistoricalData(variable, 'Custom', dataSource, customStartDate, customEndDate);
    }
    return generateHistoricalData(variable, timeRange, dataSource);
  }, [variable, timeRange, dataSource, sctService, customStartDate, customEndDate]); // sctService is stable

  // Calculate dynamic status
  // Priority: SCT live data > refreshed value > chart data
  const currentStatus = useMemo(() => {
    if (!variable) return 'normal';
    // SCT variable uses live data
    if (variable.useLiveData && variable.dataSource === 'sct' && sctValue) {
      return sctValue.status;
    }
    // Check for refreshed value from dashboard
    const refreshed = refreshedValues[variable.id];
    if (refreshed) {
      return refreshed.status;
    }
    // Fall back to chart data
    if (!chartData || chartData.length === 0) {
      return 'normal';
    }
    const lastDataPoint = chartData[chartData.length - 1];
    return lastDataPoint.status;
  }, [variable, sctValue, refreshedValues, chartData]);

  const warningReason = useMemo(() => {
    if (!variable) return 'Normal';
    let currentValue;

    // SCT variable uses live data
    if (variable.useLiveData && variable.dataSource === 'sct' && sctValue) {
      currentValue = parseFloat(sctValue.value);
    } else {
      // Check for refreshed value from dashboard first
      const refreshed = refreshedValues[variable.id];
      if (refreshed) {
        currentValue = parseFloat(refreshed.value);
      } else if (chartData && chartData.length > 0) {
        const lastDataPoint = chartData[chartData.length - 1];
        currentValue = lastDataPoint.value;
      } else {
        return 'Normal';
      }
    }

    if (currentValue > variable.upperThreshold) {
      return 'High Warning';
    } else if (currentValue < variable.lowerThreshold) {
      return 'Low Warning';
    }
    return 'Normal';
  }, [variable, sctValue, refreshedValues, chartData]);

  // Get the current display value
  // Priority: SCT live data > refreshed value > chart data > lastValue
  const currentDisplayValue = useMemo(() => {
    if (!variable) return '';
    // SCT variable uses live data
    if (variable.useLiveData && variable.dataSource === 'sct' && sctValue) {
      return `${sctValue.value} ${variable.unit}`;
    }
    // Check for refreshed value from dashboard first
    const refreshed = refreshedValues[variable.id];
    if (refreshed) {
      return refreshed.value;
    }
    // Fall back to chart data
    if (!chartData || chartData.length === 0) {
      return variable.lastValue;
    }
    const lastDataPoint = chartData[chartData.length - 1];
    return `${lastDataPoint.value} ${variable.unit}`;
  }, [variable, sctValue, refreshedValues, chartData]);

  // Calculate statistics based on chart data
  const statistics = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        average: 0,
        minimum: { value: 0, timestamp: '' },
        maximum: { value: 0, timestamp: '' },
        timeInNormalRange: 0,
        warningsTriggered: 0
      };
    }

    // Calculate average
    const sum = chartData.reduce((acc, point) => acc + point.value, 0);
    const average = sum / chartData.length;

    // Find minimum
    let minPoint = chartData[0];
    chartData.forEach(point => {
      if (point.value < minPoint.value) {
        minPoint = point;
      }
    });

    // Find maximum
    let maxPoint = chartData[0];
    chartData.forEach(point => {
      if (point.value > maxPoint.value) {
        maxPoint = point;
      }
    });

    // Count normal vs warning points
    const normalPoints = chartData.filter(point => point.status === 'normal').length;
    const warningPoints = chartData.filter(point => point.status === 'warning').length;

    // Calculate percentage of time in normal range
    const timeInNormalRange = (normalPoints / chartData.length) * 100;

    return {
      average: parseFloat(average.toFixed(1)),
      minimum: {
        value: minPoint.value,
        timestamp: minPoint.timestamp
      },
      maximum: {
        value: maxPoint.value,
        timestamp: maxPoint.timestamp
      },
      timeInNormalRange: parseFloat(timeInNormalRange.toFixed(1)),
      warningsTriggered: warningPoints
    };
  }, [chartData]);

  // Get definition for current variable
  const definition = useMemo(() => {
    if (!variable) return '';
    return variableDefinitions[variable.id] || 'No definition available for this variable.';
  }, [variable]);

  // Early return AFTER all hooks have been called
  if (!variable) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white p-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <span>←</span>
          <span>Dashboard</span>
        </button>
        <div className="bg-gray-100 dark:bg-gray-900 p-8 rounded-xl text-center">
          <p className="text-gray-700 dark:text-gray-300 text-lg">Variable not found</p>
        </div>
      </div>
    );
  }

  // Reserved for future wishlist feature
  // const inWishlist = isInWishlist(variable.id);
  void isInWishlist; // Prevent unused import warning

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setValidationError('');
  };

  const handleSaveThresholds = () => {
    const upper = parseFloat(upperThreshold);
    const lower = parseFloat(lowerThreshold);

    // Validation
    if (isNaN(upper) || isNaN(lower)) {
      setValidationError('Please enter valid numbers');
      return;
    }

    if (upper <= lower) {
      setValidationError('Upper threshold must be greater than lower threshold');
      return;
    }

    // Update variable thresholds
    variable.upperThreshold = upper;
    variable.lowerThreshold = lower;

    // Status will be calculated dynamically by calculateStatus function

    // Close modal and show success toast
    setShowModal(false);
    setShowToast(true);
    setRefreshKey(prev => prev + 1); // Force re-render to show updated status
    setTimeout(() => setShowToast(false), 3000);
  };

  const isFormValid = () => {
    const upper = parseFloat(upperThreshold);
    const lower = parseFloat(lowerThreshold);
    return !isNaN(upper) && !isNaN(lower) && upper > lower;
  };

  // CSV Export function
  const handleExportCSV = () => {
    if (!chartData || chartData.length === 0) {
      return;
    }

    // Create CSV header
    const headers = ['Timestamp', 'Value', 'Unit', 'Status', 'Upper Threshold', 'Lower Threshold'];

    // Create CSV rows
    const rows = chartData.map(point => [
      point.timestamp,
      point.value,
      variable.unit,
      point.status,
      variable.upperThreshold,
      variable.lowerThreshold
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${variable.shortName}_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle custom date range selection
  const handleCustomRangeApply = () => {
    if (customStartDate && customEndDate) {
      setTimeRange('Custom');
      setShowCustomRange(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white p-8">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-gray-900 dark:text-white hover:text-success-green dark:hover:text-success-green mb-6 transition-colors font-medium"
      >
        <span>←</span>
        <span>Dashboard</span>
      </button>

      {/* Unified Container */}
      <div className="bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-300 dark:border-gray-700 p-6">
        {/* Variable Header Section */}
        <div className="mb-6">
        {/* Row 1: Variable Name and Action Buttons */}
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{variable.name}</h1>
          <div className="flex gap-3">
            {/* WISHLIST BUTTON - COMMENTED OUT FOR NOW
            <button
              onClick={handleWishlistToggle}
              className="bg-medium-purple hover:bg-light-purple text-white px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2"
            >
              <span>{inWishlist ? '⭐' : '☆'}</span>
              <span>{inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}</span>
            </button>
            */}
            <button
              onClick={handleOpenModal}
              className="bg-medium-purple hover:bg-light-purple text-white px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2"
            >
              <span>⚙️</span>
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Row 2: Process Tags */}
        <div className="mb-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Process Tags:</p>
          <div className="flex flex-wrap gap-2">
            {variable.processes.map((process, index) => (
              <span
                key={index}
                className="bg-gray-300 dark:bg-light-purple text-gray-900 dark:text-white px-3 py-1.5 rounded-full text-sm"
              >
                {process}
              </span>
            ))}
          </div>
        </div>

        {/* Row 3: Status Information */}
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Current Value</p>
            <p className={`text-2xl font-bold transition-all duration-300 ${
              currentStatus === 'warning' ? 'text-warning-red' : 'text-gray-900 dark:text-white'
            }`}>
              {currentDisplayValue}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Status</p>
            <p className={`text-xl font-semibold transition-all duration-300 ${
              currentStatus === 'warning' ? 'text-warning-red' : 'text-success-green'
            }`}>
              {currentStatus === 'warning' ? `⚠️ ${warningReason}` : '✓ Normal'}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Last Updated</p>
            <p className="text-lg text-gray-900 dark:text-white">
              {chartData && chartData.length > 0 ? chartData[chartData.length - 1].timestamp : 'Now'}
            </p>
          </div>
        </div>
      </div>

        {/* Definition Card */}
        <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">📖</span>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Definition</h3>
        </div>
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
          {definition}
        </p>
      </div>

        {/* Thresholds Card */}
        <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Thresholds</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Upper Threshold</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {variable.upperThreshold} {variable.unit}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Lower Threshold</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {variable.lowerThreshold} {variable.unit}
            </p>
          </div>
        </div>
      </div>

        {/* Action Items Card */}
        <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🎯 Action Items</h3>

        {currentStatus === 'warning' ? (
          // Show specific fixing directions for warnings
          <div className="bg-white dark:bg-black p-4 rounded-xl border-l-4 border-warning-red">
            <div className="flex items-start gap-3">
              <span className="text-warning-red text-2xl flex-shrink-0">⚠️</span>
              <div className="flex-1">
                <h4 className="text-gray-900 dark:text-white font-bold mb-3">
                  {warningReason} Detected - Corrective Actions Required
                </h4>
                <div className="text-gray-700 dark:text-gray-300">
                  {getActionInstructions(variable, warningReason)}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-700">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    <span className="font-semibold text-warning-red">Note:</span> Monitor the variable for 5-10 minutes after taking corrective action. Contact process engineer if issue persists.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Normal status - no action needed
          <div className="bg-white dark:bg-black p-4 rounded-xl border-l-4 border-success-green">
            <div className="flex items-center gap-3">
              <span className="text-success-green text-2xl flex-shrink-0">✓</span>
              <div>
                <h4 className="text-gray-900 dark:text-white font-bold mb-1">Normal Operation</h4>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  No action required. Variable is operating within acceptable range ({variable.lowerThreshold} - {variable.upperThreshold} {variable.unit}).
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

        {/* Time Range Selector */}
        <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Time Range</h3>
          <button
            onClick={handleExportCSV}
            disabled={!chartData || chartData.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              chartData && chartData.length > 0
                ? 'bg-success-green hover:bg-green-600 text-white'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
            }`}
          >
            <span>📥</span>
            <span>Export CSV</span>
          </button>
        </div>
        <div className="grid grid-cols-5 gap-3 mb-3">
          {['Hour', 'Day', 'Week', 'Month'].map((range) => (
            <button
              key={range}
              onClick={() => {
                setTimeRange(range);
                setShowCustomRange(false);
              }}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                timeRange === range
                  ? 'bg-gray-300 dark:bg-medium-purple text-gray-900 dark:text-white border-2 border-success-green'
                  : 'bg-gray-200 dark:bg-medium-purple text-gray-800 dark:text-white opacity-70 hover:opacity-100'
              }`}
            >
              {range}
            </button>
          ))}
          <button
            onClick={() => setShowCustomRange(!showCustomRange)}
            className={`px-4 py-3 rounded-xl font-medium transition-all ${
              timeRange === 'Custom'
                ? 'bg-gray-300 dark:bg-medium-purple text-gray-900 dark:text-white border-2 border-success-green'
                : 'bg-gray-200 dark:bg-medium-purple text-gray-800 dark:text-white opacity-70 hover:opacity-100'
            }`}
          >
            Custom
          </button>
        </div>

        {/* Custom Date Range Picker */}
        {showCustomRange && (
          <div className="bg-white dark:bg-black p-4 rounded-xl border border-gray-300 dark:border-gray-700 animate-fadeIn">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-600 dark:text-gray-400 text-sm mb-2">Start Date</label>
                <input
                  type="datetime-local"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-success-green"
                />
              </div>
              <div>
                <label className="block text-gray-600 dark:text-gray-400 text-sm mb-2">End Date</label>
                <input
                  type="datetime-local"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-success-green"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCustomRange(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomRangeApply}
                disabled={!customStartDate || !customEndDate}
                className={`px-6 py-2 rounded-xl font-medium transition-all ${
                  customStartDate && customEndDate
                    ? 'bg-success-green hover:bg-green-600 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                }`}
              >
                Apply Range
              </button>
            </div>
          </div>
        )}

        {/* Show selected custom range */}
        {timeRange === 'Custom' && customStartDate && customEndDate && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Selected: {new Date(customStartDate).toLocaleString()} - {new Date(customEndDate).toLocaleString()}
          </div>
        )}
      </div>

        {/* Chart Container */}
        <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Historical Data</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridLine} opacity={0.5} />

            {/* X Axis */}
            <XAxis
              dataKey="timestamp"
              stroke={chartColors.axisStroke}
              tick={{ fill: chartColors.axisTick, fontSize: 12 }}
              axisLine={{ stroke: chartColors.axisLine }}
            />

            {/* Y Axis */}
            <YAxis
              stroke={chartColors.axisStroke}
              tick={{ fill: chartColors.axisTick, fontSize: 12 }}
              axisLine={{ stroke: chartColors.axisLine }}
              domain={[
                Math.floor(variable.lowerThreshold * 0.9),
                Math.ceil(variable.upperThreshold * 1.1)
              ]}
              label={{
                value: variable.unit,
                angle: -90,
                position: 'insideLeft',
                fill: chartColors.axisTick
              }}
            />

            {/* Custom Tooltip */}
            <Tooltip content={<CustomTooltip unit={variable.unit} />} />

            {/* Legend */}
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />

            {/* Reference Area - Above Upper Threshold (Warning Zone) */}
            <ReferenceArea
              y1={variable.upperThreshold}
              y2={Math.ceil(variable.upperThreshold * 1.1)}
              fill="#ff4444"
              fillOpacity={0.15}
            />

            {/* Reference Area - Below Lower Threshold (Warning Zone) */}
            <ReferenceArea
              y1={Math.floor(variable.lowerThreshold * 0.9)}
              y2={variable.lowerThreshold}
              fill="#ff4444"
              fillOpacity={0.15}
            />

            {/* Reference Area - Normal Zone */}
            <ReferenceArea
              y1={variable.lowerThreshold}
              y2={variable.upperThreshold}
              fill="#00ff88"
              fillOpacity={0.1}
            />

            {/* Upper Threshold Line */}
            <ReferenceLine
              y={variable.upperThreshold}
              stroke="#00ff88"
              strokeWidth={2}
              strokeDasharray="8 4"
              label={{
                value: `Upper: ${variable.upperThreshold} ${variable.unit}`,
                position: 'right',
                fill: '#00ff88',
                fontSize: 12,
                fontWeight: 'bold'
              }}
            />

            {/* Lower Threshold Line */}
            <ReferenceLine
              y={variable.lowerThreshold}
              stroke="#ff4444"
              strokeWidth={2}
              strokeDasharray="8 4"
              label={{
                value: `Lower: ${variable.lowerThreshold} ${variable.unit}`,
                position: 'right',
                fill: '#ff4444',
                fontSize: 12,
                fontWeight: 'bold'
              }}
            />

            {/* Data Line */}
            <Line
              type="monotone"
              dataKey="value"
              stroke={chartColors.dataLine}
              strokeWidth={3}
              dot={{ fill: chartColors.dataDot, r: 4 }}
              activeDot={{ r: 6, fill: chartColors.activeDot }}
              name={variable.shortName}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

        {/* Data Source Toggle - Hidden for SCT (real-time data) */}
        {!(variable.useLiveData && variable.dataSource === 'sct') && (
          <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Data Source:</h3>
            <button
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="flex items-center gap-2 bg-gray-300 dark:bg-medium-purple hover:bg-gray-400 dark:hover:bg-light-purple text-gray-900 dark:text-white px-4 py-2 rounded-xl font-medium transition-all"
              title="Reload data"
            >
              <span className="text-lg">🔄</span>
              <span>Reload</span>
            </button>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="radio"
                  name="dataSource"
                  value="normal"
                  checked={dataSource === 'normal'}
                  onChange={(e) => setDataSource(e.target.value)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 border-2 border-gray-400 dark:border-gray-400 rounded-full peer-checked:border-success-green peer-checked:bg-gray-200 dark:peer-checked:bg-[#252464] flex items-center justify-center">
                  {dataSource === 'normal' && (
                    <div className="w-2.5 h-2.5 bg-success-green rounded-full"></div>
                  )}
                </div>
              </div>
              <span className="text-gray-900 dark:text-white font-medium">Normal Dataset</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="radio"
                  name="dataSource"
                  value="abnormal"
                  checked={dataSource === 'abnormal'}
                  onChange={(e) => setDataSource(e.target.value)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 border-2 border-gray-400 dark:border-gray-400 rounded-full peer-checked:border-success-green peer-checked:bg-gray-200 dark:peer-checked:bg-[#252464] flex items-center justify-center">
                  {dataSource === 'abnormal' && (
                    <div className="w-2.5 h-2.5 bg-success-green rounded-full"></div>
                  )}
                </div>
              </div>
              <span className="text-gray-900 dark:text-white font-medium">Abnormal Dataset</span>
            </label>
          </div>
        </div>
      )}

        {/* Statistics Section */}
        <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📊 Statistics for Selected Range</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Average */}
          <div className="bg-white dark:bg-black p-4 rounded-xl border border-gray-300 dark:border-gray-700 transition-all duration-300 hover:border-success-green dark:hover:border-success-green">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📈</span>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Average</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white transition-all duration-300">
              {statistics.average} {variable.unit}
            </p>
          </div>

          {/* Minimum */}
          <div className="bg-white dark:bg-black p-4 rounded-xl border border-gray-300 dark:border-gray-700 transition-all duration-300 hover:border-success-green dark:hover:border-success-green">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⬇️</span>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Minimum</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white transition-all duration-300">
              {statistics.minimum.value} {variable.unit}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">
              at {statistics.minimum.timestamp}
            </p>
          </div>

          {/* Maximum */}
          <div className="bg-white dark:bg-black p-4 rounded-xl border border-gray-300 dark:border-gray-700 transition-all duration-300 hover:border-success-green dark:hover:border-success-green">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⬆️</span>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Maximum</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white transition-all duration-300">
              {statistics.maximum.value} {variable.unit}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">
              at {statistics.maximum.timestamp}
            </p>
          </div>

          {/* Time in Normal Range */}
          <div className={`bg-white dark:bg-black p-4 rounded-xl border transition-all duration-300 ${
            statistics.timeInNormalRange >= 90
              ? 'border-success-green hover:border-success-green'
              : 'border-warning-red hover:border-warning-red'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">✅</span>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Normal Range</p>
            </div>
            <p className={`text-2xl font-bold transition-all duration-300 ${
              statistics.timeInNormalRange >= 90 ? 'text-success-green' : 'text-warning-red'
            }`}>
              {statistics.timeInNormalRange}%
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">
              of total time
            </p>
          </div>

          {/* Warnings Triggered */}
          <div className={`bg-white dark:bg-black p-4 rounded-xl border transition-all duration-300 ${
            statistics.warningsTriggered > 5
              ? 'border-warning-red hover:border-warning-red'
              : 'border-success-green hover:border-success-green'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{statistics.warningsTriggered > 5 ? '⚠️' : '✓'}</span>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Warnings</p>
            </div>
            <p className={`text-2xl font-bold transition-all duration-300 ${
              statistics.warningsTriggered > 5 ? 'text-warning-red' : 'text-success-green'
            }`}>
              {statistics.warningsTriggered}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">
              threshold violations
            </p>
          </div>
        </div>
        </div>
      </div>

      {/* Threshold Settings Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl p-6 w-[500px] shadow-2xl animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Threshold Settings - {variable.shortName}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-2xl leading-none transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Upper Threshold */}
            <div className="mb-5">
              <label className="block text-gray-900 dark:text-white font-medium mb-2">
                Upper Threshold (High Warning)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={upperThreshold}
                  onChange={(e) => setUpperThreshold(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-[#252464] text-gray-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-medium-purple pr-16"
                  placeholder="Enter upper threshold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400">
                  {variable.unit}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Values above this will trigger warnings
              </p>
            </div>

            {/* Lower Threshold */}
            <div className="mb-5">
              <label className="block text-gray-900 dark:text-white font-medium mb-2">
                Lower Threshold (Low Warning)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={lowerThreshold}
                  onChange={(e) => setLowerThreshold(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-[#252464] text-gray-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-medium-purple pr-16"
                  placeholder="Enter lower threshold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400">
                  {variable.unit}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Values below this will trigger warnings
              </p>
            </div>

            {/* Normal Range Display */}
            {isFormValid() && (
              <div className="mb-5 p-3 bg-gray-100 dark:bg-black rounded-xl">
                <p className="text-success-green font-medium">
                  Normal Range: {lowerThreshold} - {upperThreshold} {variable.unit}
                </p>
              </div>
            )}

            {/* Validation Error */}
            {validationError && (
              <div className="mb-5 p-3 bg-warning-red bg-opacity-20 border border-warning-red rounded-xl">
                <p className="text-warning-red text-sm">{validationError}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-3 border-2 border-gray-400 dark:border-white text-gray-900 dark:text-white rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-white dark:hover:bg-opacity-10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveThresholds}
                disabled={!isFormValid()}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                  isFormValid()
                    ? 'bg-gray-300 dark:bg-medium-purple hover:bg-gray-400 dark:hover:bg-light-purple text-gray-900 dark:text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-8 right-8 bg-success-green text-deep-navy px-6 py-4 rounded-xl shadow-2xl font-medium animate-slideUp z-50">
          ✓ Threshold settings saved successfully!
        </div>
      )}

      {/* Wishlist Toast */}
      {showWishlistToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowWishlistToast(false)}
        />
      )}
    </div>
  );
};

export default Analytics;
