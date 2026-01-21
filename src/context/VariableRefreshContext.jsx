/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useRef, useCallback, useMemo } from 'react';
import { useVariableRefresh } from '../hooks/useVariableRefresh';
import { processVariables } from '../data/processVariables';

/**
 * Variable Refresh Context
 *
 * Provides shared refresh state and methods to all variable cards
 * - Mandatory 30-second auto-refresh for all variables
 * - Batched refreshes to avoid overwhelming the system
 */

const VariableRefreshContext = createContext(null);

// Auto-refresh interval: 30 seconds
const AUTO_REFRESH_INTERVAL = 30000;

export const VariableRefreshProvider = ({ children }) => {
  const refreshState = useVariableRefresh();
  const intervalRef = useRef(null);
  const isRefreshingRef = useRef(false);
  const isMountedRef = useRef(true);

  // Store refreshVariable in a ref to avoid dependency issues
  const refreshVariableRef = useRef(refreshState.refreshVariable);
  refreshVariableRef.current = refreshState.refreshVariable;

  // Stable refresh all function using ref
  const refreshAllVariables = useCallback(async () => {
    // Prevent overlapping refreshes
    if (isRefreshingRef.current || !isMountedRef.current) {
      return;
    }

    isRefreshingRef.current = true;

    try {
      const batchSize = 5;
      for (let i = 0; i < processVariables.length; i += batchSize) {
        if (!isMountedRef.current) break;

        const batch = processVariables.slice(i, i + batchSize);
        // Refresh batch in parallel
        await Promise.all(batch.map(v => refreshVariableRef.current(v.id)));

        // Small delay between batches
        if (i + batchSize < processVariables.length && isMountedRef.current) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('Auto-refresh failed:', error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, []); // No dependencies - uses refs

  // Set up 30-second auto-refresh interval - runs only once on mount
  useEffect(() => {
    isMountedRef.current = true;

    // Initial refresh after 3 seconds (let UI settle first)
    const initialTimeout = setTimeout(() => {
      if (isMountedRef.current) {
        refreshAllVariables();
      }
    }, 3000);

    // Set up recurring 30-second interval
    intervalRef.current = setInterval(() => {
      // Only refresh if page is visible and mounted
      if (!document.hidden && isMountedRef.current) {
        refreshAllVariables();
      }
    }, AUTO_REFRESH_INTERVAL);

    // Cleanup
    return () => {
      isMountedRef.current = false;
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []); // Empty dependency - only run once on mount

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    ...refreshState,
    refreshAllVariables,
    autoRefreshInterval: AUTO_REFRESH_INTERVAL
  }), [refreshState, refreshAllVariables]);

  return (
    <VariableRefreshContext.Provider value={contextValue}>
      {children}
    </VariableRefreshContext.Provider>
  );
};

/**
 * Hook to access variable refresh context
 * Must be used within VariableRefreshProvider
 */
export const useRefreshContext = () => {
  const context = useContext(VariableRefreshContext);

  if (!context) {
    throw new Error('useRefreshContext must be used within VariableRefreshProvider');
  }

  return context;
};
