import { useState, useCallback, useRef } from 'react';
import { fetchVariableData } from '../services/variableService';
import { useSCTCurrentValue } from '../context/SCTContext';

/**
 * useVariableRefresh Hook
 *
 * Provides manual refresh functionality for variable tiles
 *
 * Features:
 * - Refresh individual variables
 * - Track loading states per variable
 * - Track last updated timestamps
 * - Store refreshed values
 * - Handle SCT special case with context integration
 * - Debounce rapid clicks
 *
 * @returns {Object} Refresh state and methods
 */
export const useVariableRefresh = () => {
  // State for refreshed values (overrides static values)
  const [refreshedValues, setRefreshedValues] = useState({});

  // Loading state per variable
  const [loadingStates, setLoadingStates] = useState({});

  // Last updated timestamps per variable
  const [timestamps, setTimestamps] = useState({});

  // Error states per variable
  const [errors, setErrors] = useState({});

  // Get current SCT value from context (for ID: 2)
  const sctValue = useSCTCurrentValue();

  // Debounce tracking (prevent double-clicks)
  const debounceTimers = useRef({});

  // Store sctValue in ref to avoid dependency issues
  const sctValueRef = useRef(sctValue);
  sctValueRef.current = sctValue;

  // Track loading states in ref for checking without causing re-renders
  const loadingStatesRef = useRef(loadingStates);
  loadingStatesRef.current = loadingStates;

  /**
   * Refresh a single variable
   * @param {number} variableId - The ID of the variable to refresh
   * @returns {Promise<void>}
   */
  const refreshVariable = useCallback(async (variableId) => {
    // Debounce: ignore if already refreshing (use ref to avoid dependency)
    if (loadingStatesRef.current[variableId]) {
      return;
    }

    // Clear any existing debounce timer
    if (debounceTimers.current[variableId]) {
      clearTimeout(debounceTimers.current[variableId]);
    }

    // Set loading state
    setLoadingStates(prev => ({ ...prev, [variableId]: true }));
    setErrors(prev => ({ ...prev, [variableId]: null }));

    try {
      // Fetch new data (use ref for sctValue)
      const options = variableId === 2 ? { sctValue: sctValueRef.current } : {};
      const newData = await fetchVariableData(variableId, options);

      // Store the refreshed value
      setRefreshedValues(prev => ({
        ...prev,
        [variableId]: newData
      }));

      // Update timestamp
      setTimestamps(prev => ({
        ...prev,
        [variableId]: Date.now()
      }));

    } catch (error) {
      console.error(`Failed to refresh variable ${variableId}:`, error);
      setErrors(prev => ({
        ...prev,
        [variableId]: error.message || 'Failed to refresh'
      }));
    } finally {
      // Clear loading state
      setLoadingStates(prev => ({ ...prev, [variableId]: false }));

      // Set debounce timer (500ms cooldown)
      debounceTimers.current[variableId] = setTimeout(() => {
        delete debounceTimers.current[variableId];
      }, 500);
    }
  }, []); // No dependencies - uses refs for stability

  /**
   * Get the current value for a variable (refreshed or original)
   * @param {Object} variable - The variable object from processVariables
   * @returns {string} The display value
   */
  const getVariableValue = useCallback((variable) => {
    const refreshed = refreshedValues[variable.id];
    if (refreshed) {
      return refreshed.value;
    }
    return variable.lastValue;
  }, [refreshedValues]);

  /**
   * Get the status for a variable (refreshed or original)
   * @param {Object} variable - The variable object
   * @param {string} originalStatus - The original calculated status
   * @returns {string} 'warning' or 'normal'
   */
  const getVariableStatus = useCallback((variable, originalStatus) => {
    const refreshed = refreshedValues[variable.id];
    if (refreshed) {
      return refreshed.status;
    }
    return originalStatus;
  }, [refreshedValues]);

  /**
   * Get formatted "last updated" text
   * @param {number} variableId - The variable ID
   * @returns {string} Formatted timestamp text (e.g., "2m ago", "just now")
   */
  const getLastUpdatedText = useCallback((variableId) => {
    const timestamp = timestamps[variableId];
    if (!timestamp) {
      return null;
    }

    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 10) {
      return 'just now';
    } else if (seconds < 60) {
      return `${seconds}s ago`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m ago`;
    } else {
      const hours = Math.floor(seconds / 3600);
      return `${hours}h ago`;
    }
  }, [timestamps]);

  /**
   * Check if a variable is currently loading
   * @param {number} variableId - The variable ID
   * @returns {boolean}
   */
  const isLoading = useCallback((variableId) => {
    return !!loadingStates[variableId];
  }, [loadingStates]);

  /**
   * Get error for a variable
   * @param {number} variableId - The variable ID
   * @returns {string|null} Error message or null
   */
  const getError = useCallback((variableId) => {
    return errors[variableId] || null;
  }, [errors]);

  /**
   * Clear error for a variable
   * @param {number} variableId - The variable ID
   */
  const clearError = useCallback((variableId) => {
    setErrors(prev => ({ ...prev, [variableId]: null }));
  }, []);

  return {
    // Methods
    refreshVariable,
    getVariableValue,
    getVariableStatus,
    getLastUpdatedText,
    isLoading,
    getError,
    clearError,

    // State (for advanced usage)
    refreshedValues,
    loadingStates,
    timestamps,
    errors
  };
};
