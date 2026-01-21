// Utility function to dynamically calculate variable status based on thresholds
export const calculateStatus = (variable) => {
  // Extract numeric value from lastValue string (e.g., "1250 fpm" -> 1250)
  const currentValue = parseFloat(variable.lastValue);

  // Check if value is outside thresholds
  if (currentValue > variable.upperThreshold || currentValue < variable.lowerThreshold) {
    return 'warning';
  }

  return 'normal';
};

// Get warning reason for a variable (simple version using lastValue only)
export const getWarningReason = (variable) => {
  const currentValue = parseFloat(variable.lastValue);

  if (currentValue > variable.upperThreshold) {
    return 'High Warning';
  } else if (currentValue < variable.lowerThreshold) {
    return 'Low Warning';
  }

  return 'Normal';
};

// Get warning type with support for SCT live data and refreshed values
export const getWarningType = (variable, sctValue = null, refreshedValues = {}) => {
  let currentValue;

  // For SCT variable (ID: 2), use live data if available
  if (variable.id === 2 && variable.useLiveData && variable.dataSource === 'sct' && sctValue) {
    currentValue = parseFloat(sctValue.value);
  } else {
    // Check refreshed values first, fall back to lastValue
    const refreshed = refreshedValues[variable.id];
    currentValue = refreshed ? parseFloat(refreshed.value) : parseFloat(variable.lastValue);
  }

  if (currentValue > variable.upperThreshold) return 'High Warning';
  if (currentValue < variable.lowerThreshold) return 'Low Warning';
  return 'Normal';
};

// Get current display value for a variable (handles SCT and refreshed values)
export const getCurrentDisplayValue = (variable, sctValue = null, refreshedValues = {}) => {
  if (variable.id === 2 && variable.useLiveData && variable.dataSource === 'sct' && sctValue) {
    return `${sctValue.value} ${variable.unit}`;
  }

  const refreshed = refreshedValues[variable.id];
  return refreshed ? `${refreshed.value} ${variable.unit}` : variable.lastValue;
};
