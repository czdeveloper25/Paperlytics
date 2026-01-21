import { useEffect, useRef, useState } from 'react';

/**
 * useVariableAutoRefresh Hook
 *
 * Manages automatic refresh intervals for variables
 *
 * Features:
 * - Configurable intervals (30s, 1min, 5min)
 * - Pause when tab/page is hidden (Page Visibility API)
 * - Staggered start times to avoid all firing at once
 * - Cleanup on unmount
 * - localStorage persistence
 *
 * @param {number} variableId - The variable ID
 * @param {number|null} interval - Interval in milliseconds (null = disabled)
 * @param {Function} refreshCallback - Function to call on each interval
 */
export const useVariableAutoRefresh = (variableId, interval, refreshCallback) => {
  const intervalRef = useRef(null);
  const callbackRef = useRef(refreshCallback);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = refreshCallback;
  }, [refreshCallback]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Manage auto-refresh interval
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Don't start if interval is null or paused
    if (!interval || isPaused) {
      setIsActive(false);
      return;
    }

    // Add stagger: random delay between 0-2000ms before starting
    // This prevents all auto-refreshing variables from firing at the same time
    const staggerDelay = Math.random() * 2000;

    const staggerTimeout = setTimeout(() => {
      // Start the interval
      intervalRef.current = setInterval(() => {
        if (callbackRef.current) {
          callbackRef.current(variableId);
        }
      }, interval);

      setIsActive(true);

      // Immediately call once on start (after stagger)
      if (callbackRef.current) {
        callbackRef.current(variableId);
      }
    }, staggerDelay);

    // Cleanup function
    return () => {
      clearTimeout(staggerTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsActive(false);
    };
  }, [variableId, interval, isPaused]);

  return {
    isActive: isActive && !isPaused,
    isPaused
  };
};

/**
 * Hook to manage auto-refresh settings for all variables
 * Stores settings in localStorage for persistence
 */
export const useAutoRefreshSettings = () => {
  const STORAGE_KEY = 'variableAutoRefreshSettings';

  // Load initial settings from localStorage
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load auto-refresh settings:', error);
      return {};
    }
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save auto-refresh settings:', error);
    }
  }, [settings]);

  /**
   * Set auto-refresh interval for a variable
   * @param {number} variableId - The variable ID
   * @param {number|null} interval - Interval in milliseconds (null = off)
   */
  const setAutoRefresh = (variableId, interval) => {
    setSettings(prev => ({
      ...prev,
      [variableId]: interval
    }));
  };

  /**
   * Get auto-refresh interval for a variable
   * @param {number} variableId - The variable ID
   * @returns {number|null} Interval in milliseconds or null
   */
  const getAutoRefresh = (variableId) => {
    return settings[variableId] || null;
  };

  /**
   * Clear auto-refresh for a variable
   * @param {number} variableId - The variable ID
   */
  const clearAutoRefresh = (variableId) => {
    setSettings(prev => {
      const updated = { ...prev };
      delete updated[variableId];
      return updated;
    });
  };

  /**
   * Clear all auto-refresh settings
   */
  const clearAllAutoRefresh = () => {
    setSettings({});
  };

  /**
   * Get count of variables with auto-refresh enabled
   * @returns {number}
   */
  const getActiveCount = () => {
    return Object.keys(settings).filter(key => settings[key] !== null).length;
  };

  /**
   * Set auto-refresh for multiple variables at once
   * @param {Array<number>} variableIds - Array of variable IDs
   * @param {number|null} interval - Interval to set
   */
  const setBulkAutoRefresh = (variableIds, interval) => {
    setSettings(prev => {
      const updated = { ...prev };
      variableIds.forEach(id => {
        if (interval === null) {
          delete updated[id];
        } else {
          updated[id] = interval;
        }
      });
      return updated;
    });
  };

  return {
    settings,
    setAutoRefresh,
    getAutoRefresh,
    clearAutoRefresh,
    clearAllAutoRefresh,
    getActiveCount,
    setBulkAutoRefresh
  };
};

/**
 * Available auto-refresh intervals
 */
export const REFRESH_INTERVALS = {
  OFF: null,
  THIRTY_SECONDS: 30000,
  ONE_MINUTE: 60000,
  FIVE_MINUTES: 300000
};

/**
 * Get display label for an interval value
 * @param {number|null} interval - Interval in milliseconds
 * @returns {string} Display label
 */
export const getIntervalLabel = (interval) => {
  switch (interval) {
    case REFRESH_INTERVALS.OFF:
      return 'OFF';
    case REFRESH_INTERVALS.THIRTY_SECONDS:
      return '30 seconds';
    case REFRESH_INTERVALS.ONE_MINUTE:
      return '1 minute';
    case REFRESH_INTERVALS.FIVE_MINUTES:
      return '5 minutes';
    default:
      return 'OFF';
  }
};
