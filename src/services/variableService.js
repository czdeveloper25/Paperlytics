/**
 * Variable Service - Central data fetching for all variables
 *
 * This service handles fetching fresh variable data with two modes:
 * 1. SCT (ID: 2) - Uses existing CSV mock data from SCTContext
 * 2. All others - Generates random values within thresholds (simulated)
 *
 * Future API Integration: Replace mockFetchVariable with real API calls
 */

import { processVariables } from '../data/processVariables';

/**
 * Generate mock data for non-SCT variables
 * @param {Object} variable - The variable object from processVariables
 * @returns {Object} New variable data with value, timestamp, status
 */
const generateMockData = (variable) => {
  const range = variable.upperThreshold - variable.lowerThreshold;
  const newValue = variable.lowerThreshold + (Math.random() * range);

  // Determine status based on thresholds
  const isWarning = newValue > variable.upperThreshold || newValue < variable.lowerThreshold;

  return {
    value: `${newValue.toFixed(1)} ${variable.unit}`,
    rawValue: newValue,
    timestamp: new Date().toISOString(),
    status: isWarning ? 'warning' : 'normal'
  };
};

/**
 * Fetch variable data (mock implementation)
 *
 * For SCT (ID: 2): Returns current context value (handled by caller)
 * For others: Generates random value within thresholds
 *
 * @param {number} variableId - The ID of the variable to fetch
 * @param {Object} options - Additional options
 * @param {Object} options.sctValue - Current SCT value from context (for ID: 2)
 * @returns {Promise<Object>} Variable data with value, timestamp, status
 */
export const fetchVariableData = async (variableId, options = {}) => {
  // Find the variable definition
  const variable = processVariables.find(v => v.id === variableId);

  if (!variable) {
    throw new Error(`Variable with ID ${variableId} not found`);
  }

  // Simulate network delay (100-300ms)
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

  // Special case: SCT uses existing context value
  if (variableId === 2 && variable.useLiveData && variable.dataSource === 'sct' && options.sctValue) {
    return {
      value: `${options.sctValue.value} ${variable.unit}`,
      rawValue: parseFloat(options.sctValue.value),
      timestamp: options.sctValue.timestamp || new Date().toISOString(),
      status: options.sctValue.status
    };
  }

  // For all other variables: generate mock data
  return generateMockData(variable);
};

/**
 * Batch fetch multiple variables
 * Used for "Refresh All" functionality
 *
 * @param {Array<number>} variableIds - Array of variable IDs to fetch
 * @param {Object} options - Options passed to fetchVariableData
 * @param {number} options.batchSize - Max concurrent requests (default: 5)
 * @returns {Promise<Object>} Map of variableId to fetched data
 */
export const fetchMultipleVariables = async (variableIds, options = {}) => {
  const { batchSize = 5, ...fetchOptions } = options;
  const results = {};

  // Process in batches to avoid overwhelming the system
  for (let i = 0; i < variableIds.length; i += batchSize) {
    const batch = variableIds.slice(i, i + batchSize);

    // Fetch batch in parallel
    const batchResults = await Promise.allSettled(
      batch.map(id => fetchVariableData(id, fetchOptions))
    );

    // Store results
    batchResults.forEach((result, index) => {
      const variableId = batch[index];
      if (result.status === 'fulfilled') {
        results[variableId] = result.value;
      } else {
        results[variableId] = {
          error: true,
          message: result.reason?.message || 'Failed to fetch data'
        };
      }
    });

    // Small delay between batches
    if (i + batchSize < variableIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
};

/**
 * Future API Integration Point
 *
 * When backend is ready, replace the above implementations with:
 *
 * export const fetchVariableData = async (variableId) => {
 *   const response = await fetch(`/api/variables/${variableId}`);
 *   if (!response.ok) {
 *     throw new Error('Failed to fetch variable data');
 *   }
 *   return response.json();
 * };
 *
 * export const fetchMultipleVariables = async (variableIds) => {
 *   const response = await fetch('/api/variables/batch', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ ids: variableIds })
 *   });
 *   if (!response.ok) {
 *     throw new Error('Failed to fetch variables');
 *   }
 *   return response.json();
 * };
 */
