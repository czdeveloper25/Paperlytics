/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { sctService } from '../services/sctService';

/**
 * Split Context Architecture for Optimal Performance
 *
 * Instead of one context that forces all consumers to re-render,
 * we split into 3 separate contexts so components only re-render
 * when their specific data changes.
 */

// Context 1: Current Value (changes every 60 seconds to match CSV data intervals)
const SCTCurrentValueContext = createContext(undefined);

// Context 2: Service Methods (stable, never changes)
const SCTServiceContext = createContext(null);

// Context 3: Controls (stable functions)
const SCTControlsContext = createContext(null);

// Provider component
export const SCTProvider = ({ children }) => {
  const [currentValue, setCurrentValue] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  // Initialize data
  useEffect(() => {
    const initial = sctService.getCurrentValue();
    setCurrentValue(initial);
  }, []);

  // Update current value synced to minute boundaries
  useEffect(() => {
    if (isPaused) return;

    let intervalId = null;

    // Calculate milliseconds until next minute boundary
    const getDelayToNextMinute = () => {
      const now = new Date();
      const seconds = now.getSeconds();
      const milliseconds = now.getMilliseconds();
      // Time until next :00 seconds
      return (60 - seconds) * 1000 - milliseconds;
    };

    // Set up the sync to minute boundary
    const syncToMinute = () => {
      const delay = getDelayToNextMinute();

      // Wait until next minute, then update and start regular interval
      const timeoutId = setTimeout(() => {
        const newValue = sctService.getCurrentValue();
        setCurrentValue(newValue);

        // Now set up regular 30-second interval
        intervalId = setInterval(() => {
          const newValue = sctService.getCurrentValue();
          setCurrentValue(newValue);
        }, 30000);
      }, delay);

      return timeoutId;
    };

    const timeoutId = syncToMinute();

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPaused]);

  // Stable service methods - created once, never change
  const serviceValue = useMemo(() => ({
    getHistoricalData: sctService.getHistoricalData.bind(sctService),
    getAllData: sctService.getAllData.bind(sctService),
    config: sctService.getConfig(),
  }), []); // Empty deps - created once

  // Stable control functions
  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);
  const reset = useCallback(() => {
    sctService.reset();
    const initial = sctService.getCurrentValue();
    setCurrentValue(initial);
  }, []);

  const controlsValue = useMemo(() => ({
    isPaused,
    pause,
    resume,
    reset,
  }), [isPaused, pause, resume, reset]);

  return (
    <SCTCurrentValueContext.Provider value={currentValue}>
      <SCTServiceContext.Provider value={serviceValue}>
        <SCTControlsContext.Provider value={controlsValue}>
          {children}
        </SCTControlsContext.Provider>
      </SCTServiceContext.Provider>
    </SCTCurrentValueContext.Provider>
  );
};

/**
 * Hook to get ONLY current value
 * Components using this will re-render every 60 seconds
 * Use ONLY when you need the live current value
 */
export const useSCTCurrentValue = () => {
  const context = useContext(SCTCurrentValueContext);
  if (context === undefined) {
    throw new Error('useSCTCurrentValue must be used within SCTProvider');
  }
  return context;
};

/**
 * Hook to get ONLY service methods (historical data, etc.)
 * Components using this will NEVER re-render from SCT updates
 * Use for charts and static data
 */
export const useSCTService = () => {
  const context = useContext(SCTServiceContext);
  if (!context) {
    throw new Error('useSCTService must be used within SCTProvider');
  }
  return context;
};

/**
 * Hook to get ONLY control functions
 * Components using this will rarely re-render (only on pause/resume)
 */
export const useSCTControls = () => {
  const context = useContext(SCTControlsContext);
  if (!context) {
    throw new Error('useSCTControls must be used within SCTProvider');
  }
  return context;
};

/**
 * Backward compatibility hook - combines all contexts
 * WARNING: Using this causes re-renders every 60 seconds
 * Prefer using specific hooks above for better performance
 */
export const useSCT = () => {
  const currentValue = useSCTCurrentValue();
  const service = useSCTService();
  const controls = useSCTControls();

  return useMemo(() => ({
    currentValue,
    ...service,
    ...controls,
  }), [currentValue, service, controls]);
};
