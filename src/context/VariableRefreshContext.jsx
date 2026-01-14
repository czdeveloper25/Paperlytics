import React, { createContext, useContext } from 'react';
import { useVariableRefresh } from '../hooks/useVariableRefresh';

/**
 * Variable Refresh Context
 *
 * Provides shared refresh state and methods to all variable cards
 * This ensures:
 * - Single source of truth for refresh state
 * - Global "Refresh All" functionality
 * - Shared loading/timestamp tracking
 */

const VariableRefreshContext = createContext(null);

export const VariableRefreshProvider = ({ children }) => {
  const refreshState = useVariableRefresh();

  return (
    <VariableRefreshContext.Provider value={refreshState}>
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
