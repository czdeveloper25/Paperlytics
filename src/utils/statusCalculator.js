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

// Get warning reason for a variable
export const getWarningReason = (variable) => {
  const currentValue = parseFloat(variable.lastValue);

  if (currentValue > variable.upperThreshold) {
    return 'High Warning';
  } else if (currentValue < variable.lowerThreshold) {
    return 'Low Warning';
  }

  return 'Normal';
};
