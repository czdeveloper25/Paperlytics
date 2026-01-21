import { sctData, SCT_CONFIG } from '../data/sctData';

/**
 * SCT Data Service
 * Manages cycling through CSV data to simulate real-time updates
 */
class SCTService {
  constructor() {
    this.data = sctData;
    this.config = SCT_CONFIG;

    // Initialize index based on current local time
    this.currentIndex = this.getIndexForCurrentTime();

    // Enhanced cache for expensive operations
    this.cache = {
      historicalData: null,
      historicalDataIndex: -1,
      historicalDataCount: -1,
      historicalDataTimestamp: 0,
      allData: null,
      allDataIndex: -1,
      allDataTimestamp: 0,
    };

    // Timestamp cache duration - don't recalculate more often than this
    this.TIMESTAMP_CACHE_DURATION = 2000; // 2 seconds
  }

  /**
   * Get the data index that corresponds to the current local time
   * Maps hours:minutes to index (0-1439 for 24 hours of minute data)
   */
  getIndexForCurrentTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    // Each index represents 1 minute: index = hours * 60 + minutes
    return (hours * 60 + minutes) % this.data.length;
  }

  /**
   * Get current value synced to local time
   * The data index is determined by current hours:minutes
   * So if local time is 10:30, we show the 10:30:00 data point
   */
  getCurrentValue() {
    // Sync index with current local time
    this.currentIndex = this.getIndexForCurrentTime();

    const dataPoint = this.data[this.currentIndex];
    const now = new Date();

    // Build display timestamp using today's date but CSV's time
    const csvTime = dataPoint.timestamp.split(' ')[1]; // Extract "HH:MM:SS"
    const today = now.toISOString().split('T')[0]; // "YYYY-MM-DD"
    const displayTimestamp = `${today} ${csvTime}`;

    return {
      value: dataPoint.value,
      timestamp: now.toISOString(),
      csvTimestamp: displayTimestamp, // Today's date with CSV time (synced to local time)
      status: this.calculateStatus(dataPoint.value)
    };
  }

  /**
   * Get historical data for charts
   * @param {number} count - Number of data points to return
   * @returns {Array} Historical data points mapped to recent timestamps
   */
  getHistoricalData(count = 24) {
    const endIndex = this.currentIndex === 0 ? this.data.length - 1 : this.currentIndex - 1;
    const now = Date.now();

    // Check if cache is still valid (same index, count, and within timestamp duration)
    if (
      this.cache.historicalData &&
      this.cache.historicalDataIndex === endIndex &&
      this.cache.historicalDataCount === count &&
      (now - this.cache.historicalDataTimestamp) < this.TIMESTAMP_CACHE_DURATION
    ) {
      // Return cached data without recalculation
      return this.cache.historicalData;
    }

    // Cache miss or expired - full recalculation
    const startIndex = endIndex - count + 1;

    const dataPoints = [];
    for (let i = 0; i < count; i++) {
      const index = (startIndex + i + this.data.length) % this.data.length;
      dataPoints.push(this.data[index]);
    }

    const result = dataPoints.map((point, index) => {
      const minutesAgo = count - index - 1;
      const adjustedTime = new Date(now - minutesAgo * 60000);

      return {
        timestamp: adjustedTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        fullTimestamp: adjustedTime.toISOString(),
        value: point.value,
        status: this.calculateStatus(point.value)
      };
    });

    // Update cache with timestamp
    this.cache.historicalData = result;
    this.cache.historicalDataIndex = endIndex;
    this.cache.historicalDataCount = count;
    this.cache.historicalDataTimestamp = now;

    return result;
  }

  /**
   * Get all data (for Analytics page)
   * Maps all 1440 CSV points to recent timestamps (last 24 hours from now)
   * Rotates array so currentIndex is at the end (most recent)
   */
  getAllData() {
    const endIndex = this.currentIndex === 0 ? this.data.length - 1 : this.currentIndex - 1;
    const now = Date.now();

    // Check if cache is still valid
    if (
      this.cache.allData &&
      this.cache.allDataIndex === endIndex &&
      (now - this.cache.allDataTimestamp) < this.TIMESTAMP_CACHE_DURATION
    ) {
      // Return cached data without recalculation
      return this.cache.allData;
    }

    // Cache miss or expired - full recalculation
    // Rotate array so currentIndex - 1 is at the end (most recent)
    const rotatedData = [];
    for (let i = 0; i < this.data.length; i++) {
      const index = (endIndex - this.data.length + 1 + i + this.data.length) % this.data.length;
      rotatedData.push(this.data[index]);
    }

    const result = rotatedData.map((point, index) => {
      const minutesAgo = this.data.length - index - 1;
      const adjustedTime = new Date(now - minutesAgo * 60000);

      return {
        timestamp: adjustedTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        fullTimestamp: adjustedTime.toISOString(),
        value: point.value,
        status: this.calculateStatus(point.value)
      };
    });

    // Update cache with timestamp
    this.cache.allData = result;
    this.cache.allDataIndex = endIndex;
    this.cache.allDataTimestamp = now;

    return result;
  }

  /**
   * Calculate status based on thresholds
   */
  calculateStatus(value) {
    if (value > this.config.upperThreshold || value < this.config.lowerThreshold) {
      return 'warning';
    }
    return 'normal';
  }

  /**
   * Get configuration
   */
  getConfig() {
    return this.config;
  }

  /**
   * Reset to beginning of data
   */
  reset() {
    this.currentIndex = 0;
  }

  /**
   * Set specific index (for testing or specific scenarios)
   */
  setIndex(index) {
    this.currentIndex = Math.max(0, Math.min(index, this.data.length - 1));
  }

  /**
   * Get current index
   */
  getCurrentIndex() {
    return this.currentIndex;
  }

  /**
   * Get total data points
   */
  getDataLength() {
    return this.data.length;
  }
}

// Export singleton instance
export const sctService = new SCTService();
