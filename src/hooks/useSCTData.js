import { useState, useEffect, useCallback } from 'react';
import { sctService } from '../services/sctService';

/**
 * Custom hook for SCT live data
 * Cycles through CSV data to simulate real-time updates
 *
 * @param {number} updateInterval - Update interval in milliseconds (default: 2000)
 * @returns {Object} { currentValue, historicalData, allData, config, isPaused, pause, resume, reset }
 */
export const useSCTData = (updateInterval = 2000) => {
  const [currentValue, setCurrentValue] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [config] = useState(sctService.getConfig());

  // Initialize data
  useEffect(() => {
    const initial = sctService.getCurrentValue();
    setCurrentValue(initial);
    setHistoricalData(sctService.getHistoricalData(24));
    setAllData(sctService.getAllData());
  }, []);

  // Update current value at interval
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const newValue = sctService.getCurrentValue();
      setCurrentValue(newValue);
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval, isPaused]);

  // Control functions
  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const reset = useCallback(() => {
    sctService.reset();
    const initial = sctService.getCurrentValue();
    setCurrentValue(initial);
  }, []);

  return {
    currentValue,
    historicalData,
    allData,
    config,
    isPaused,
    pause,
    resume,
    reset
  };
};
