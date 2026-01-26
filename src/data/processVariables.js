/**
 * Generate mock historical data for chart visualization
 * @param {Object} variable - The process variable object
 * @param {String} timeRange - 'Hour', 'Day', 'Week', 'Month', or 'Custom'
 * @param {String} dataSource - 'normal' or 'abnormal'
 * @param {String} customStartDate - Optional start date for custom range (ISO string)
 * @param {String} customEndDate - Optional end date for custom range (ISO string)
 * @returns {Array} Array of data points with timestamp, value, and status
 */
export const generateHistoricalData = (
  variable,
  timeRange,
  dataSource,
  customStartDate = null,
  customEndDate = null
) => {
  const { upperThreshold, lowerThreshold } = variable;
  const range = upperThreshold - lowerThreshold;

  // Determine number of data points and time increment based on range
  let dataPoints, timeIncrement, startTime;
  const now = new Date();

  // Handle custom date range
  if (timeRange === "Custom" && customStartDate && customEndDate) {
    const start = new Date(customStartDate);
    const end = new Date(customEndDate);
    const duration = end.getTime() - start.getTime();

    // Ensure valid duration
    if (duration <= 0) {
      // Invalid range, return empty
      return [];
    }

    // Determine appropriate data resolution based on duration
    if (duration <= 60 * 60 * 1000) {
      // Up to 1 hour: 1 point per minute
      dataPoints = Math.max(1, Math.ceil(duration / (60 * 1000)));
      timeIncrement = 60 * 1000;
    } else if (duration <= 24 * 60 * 60 * 1000) {
      // Up to 1 day: 1 point per 15 minutes
      dataPoints = Math.max(1, Math.ceil(duration / (15 * 60 * 1000)));
      timeIncrement = 15 * 60 * 1000;
    } else if (duration <= 7 * 24 * 60 * 60 * 1000) {
      // Up to 1 week: 1 point per hour
      dataPoints = Math.max(1, Math.ceil(duration / (60 * 60 * 1000)));
      timeIncrement = 60 * 60 * 1000;
    } else {
      // More than 1 week: 1 point per day
      dataPoints = Math.max(1, Math.ceil(duration / (24 * 60 * 60 * 1000)));
      timeIncrement = 24 * 60 * 60 * 1000;
    }
    startTime = start.getTime();
  } else {
    switch (timeRange) {
      case "Hour":
        dataPoints = 60; // 1 per minute
        timeIncrement = 60 * 1000; // 1 minute in milliseconds
        break;
      case "Day":
        dataPoints = 24; // 1 per hour
        timeIncrement = 60 * 60 * 1000; // 1 hour in milliseconds
        break;
      case "Week":
        dataPoints = 7; // 1 per day
        timeIncrement = 24 * 60 * 60 * 1000; // 1 day in milliseconds
        break;
      case "Month":
        dataPoints = 30; // 1 per day
        timeIncrement = 24 * 60 * 60 * 1000; // 1 day in milliseconds
        break;
      default:
        dataPoints = 24;
        timeIncrement = 60 * 60 * 1000;
    }
    // For non-custom ranges, go backwards from now
    startTime = now.getTime() - (dataPoints - 1) * timeIncrement;
  }

  const data = [];

  // Generate data points starting from startTime
  for (let i = 0; i < dataPoints; i++) {
    const timestamp = new Date(startTime + i * timeIncrement);
    let value;

    if (dataSource === "normal") {
      // Normal dataset: values stay within thresholds with realistic variation
      // Center the values around the middle of the range
      const midPoint = (upperThreshold + lowerThreshold) / 2;
      const safeRange = range * 0.6; // Use 60% of total range for normal fluctuation

      // Generate value with some randomness around midpoint
      const randomFactor = (Math.random() - 0.5) * safeRange;
      value = midPoint + randomFactor;

      // Add occasional values closer to thresholds (but not exceeding)
      // 10% chance of being near upper threshold
      if (Math.random() > 0.9) {
        value = upperThreshold - Math.random() * range * 0.1;
      }
      // 10% chance of being near lower threshold
      if (Math.random() > 0.9) {
        value = lowerThreshold + Math.random() * range * 0.1;
      }
    } else {
      // Abnormal dataset: mix of normal and abnormal values
      const scenario = Math.random();

      if (scenario < 0.3) {
        // 30% chance: Value exceeds upper threshold
        const excess = range * (0.05 + Math.random() * 0.15); // 5-20% above
        value = upperThreshold + excess;
      } else if (scenario < 0.5) {
        // 20% chance: Value falls below lower threshold
        const deficit = range * (0.05 + Math.random() * 0.15); // 5-20% below
        value = lowerThreshold - deficit;
      } else {
        // 50% chance: Normal range values
        const midPoint = (upperThreshold + lowerThreshold) / 2;
        const safeRange = range * 0.7;
        const randomFactor = (Math.random() - 0.5) * safeRange;
        value = midPoint + randomFactor;
      }
    }

    // Calculate status based on thresholds
    let status = "normal";
    if (value > upperThreshold || value < lowerThreshold) {
      status = "warning";
    }

    // Format timestamp based on time range
    let formattedTimestamp;
    if (timeRange === "Hour") {
      formattedTimestamp = timestamp.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (timeRange === "Day") {
      formattedTimestamp = timestamp.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (timeRange === "Custom") {
      // For custom range, include date and time
      formattedTimestamp = timestamp.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      formattedTimestamp = timestamp.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }

    data.push({
      timestamp: formattedTimestamp,
      fullTimestamp: timestamp.toISOString(),
      value: parseFloat(value.toFixed(2)),
      status,
    });
  }

  return data;
};

export const processes = [
  "Stock preparation",
  "Refining",
  "Wet End",
  "Press",
  "Drying",
  "Others",
  "Quality",
  "Cost",
  "Production",
];

export const processVariables = [
  {
    id: 1,
    name: "Machine Speed | DRV39",
    shortName: "Machine Speed",
    lastValue: "2455.0 FPM",
    unit: "FPM",
    processes: ["Wet End", "Press", "Drying", "Quality", "Cost", "Production"],
    upperThreshold: 2598.0,
    lowerThreshold: 2312.0,
    historicalData: [],
  },
  {
    id: 2,
    name: "QCS | SCT | Avg",
    shortName: "SCT Avg",
    lastValue: "10.2 lbs",
    unit: "lbs",
    processes: ["Others", "Quality"],
    upperThreshold: 13.0,
    lowerThreshold: 7.4,
    historicalData: [],
    useLiveData: true, // Flag for CSV data
    dataSource: "sct", // Identifies data source
  },
  {
    id: 3,
    name: "Now BW | FR1_BW1_CURV:ROUT",
    shortName: "Now BW",
    lastValue: "25.8 lbs/MSF", // HIGH WARNING - Above upperThreshold (24.0)
    unit: "lbs/MSF",
    processes: ["Others", "Quality"],
    upperThreshold: 24.0,
    lowerThreshold: 21.5,
    historicalData: [],
  },
  {
    id: 4,
    name: "3rd Dryer Section Pressure Control | PIC-2367-120",
    shortName: "PIC-2367-120",
    lastValue: "72.0 psi",
    unit: "psi",
    processes: ["Drying", "Cost", "Production"],
    upperThreshold: 82.6,
    lowerThreshold: 61.4,
    historicalData: [],
  },
  {
    id: 5,
    name: "TAPPI Drying Rate-32 Cans",
    shortName: "TAPPI Drying Rate-32",
    lastValue: "5.2 lb/hr/sqft", // LOW WARNING - Below lowerThreshold (5.5)
    unit: "lb/hr/sqft",
    processes: ["Drying", "Production"],
    upperThreshold: 6.2,
    lowerThreshold: 5.5,
    historicalData: [],
  },
  {
    id: 6,
    name: "Stock Storage Tower Level Indication | LI-2180-101",
    shortName: "LI-2180-101",
    lastValue: "42.3 %", // LOW WARNING - Below lowerThreshold (45.4)
    unit: "%",
    processes: ["Stock preparation", "Production"],
    upperThreshold: 86.6,
    lowerThreshold: 45.4,
    historicalData: [],
  },
  {
    id: 7,
    name: "Stock Production | TPH (TPH)",
    shortName: "TPH (TPH)",
    lastValue: "31.6 TPH",
    unit: "TPH",
    processes: ["Stock preparation", "Production"],
    upperThreshold: 43.5,
    lowerThreshold: 19.7,
    historicalData: [],
  },
  {
    id: 8,
    name: "Primary Coarse Screen Accepts Flow Control | FFIC-2024-112",
    shortName: "FFIC-2024-112",
    lastValue: "3747.5 GPM",
    unit: "GPM",
    processes: ["Stock preparation", "Production"],
    upperThreshold: 4854.0,
    lowerThreshold: 2641.0,
    historicalData: [],
  },
  {
    id: 9,
    name: "Secondary Coarse Screen Accepts Flow | FI-2017-203B",
    shortName: "FI-2017-203B",
    lastValue: "1440.5 GPM",
    unit: "GPM",
    processes: ["Stock preparation", "Production"],
    upperThreshold: 1933.0,
    lowerThreshold: 948.0,
    historicalData: [],
  },
  {
    id: 10,
    name: "SEC For Refiners (New)",
    shortName: "SEC For Refiners (Ne",
    lastValue: "43.5 kWh/ton", // HIGH WARNING - Above upperThreshold (39.7)
    unit: "kWh/ton",
    processes: ["Refining", "Quality", "Production"],
    upperThreshold: 39.7,
    lowerThreshold: 12.8,
    historicalData: [],
  },
  {
    id: 11,
    name: "Refiner recirc %",
    shortName: "Refiner recirc %",
    lastValue: "12.6 %",
    unit: "%",
    processes: ["Refining", "Quality", "Production"],
    upperThreshold: 21.9,
    lowerThreshold: 3.4,
    historicalData: [],
  },
  {
    id: 12,
    name: "Refiner No.1 kW/hr | JIC-2123-211",
    shortName: "JIC-2123-211",
    lastValue: "1015.5 kW/hr",
    unit: "kW/hr",
    processes: ["Refining", "Cost"],
    upperThreshold: 1417.0,
    lowerThreshold: 614.0,
    historicalData: [],
  },
  {
    id: 13,
    name: "Refiner No.2 kW/hr | JIC-2123-221",
    shortName: "JIC-2123-221",
    lastValue: "579.0 kW/hr",
    unit: "kW/hr",
    processes: ["Refining", "Cost"],
    upperThreshold: 963.0,
    lowerThreshold: 195.0,
    historicalData: [],
  },
  {
    id: 14,
    name: "Refiners #1 Outlet Flow Control PV | FFIC-2123-242",
    shortName: "FFIC-2123-242",
    lastValue: "1958.0 GPM",
    unit: "GPM",
    processes: ["Refining", "Quality"],
    upperThreshold: 2542.0,
    lowerThreshold: 1374.0,
    historicalData: [],
  },
  {
    id: 15,
    name: "Refiners #2 Outlet Flow Control PV | FFIC-2123-243",
    shortName: "FFIC-2123-243",
    lastValue: "1555.0 GPM",
    unit: "GPM",
    processes: ["Refining", "Quality"],
    upperThreshold: 2035.0,
    lowerThreshold: 1075.0,
    historicalData: [],
  },
  {
    id: 16,
    name: "QCS | RCT | Avg",
    shortName: "Avg",
    lastValue: "27.8 lbs",
    unit: "lbs",
    processes: ["Others", "Quality"],
    upperThreshold: 31.1,
    lowerThreshold: 24.4,
    historicalData: [],
  },
  {
    id: 17,
    name: "QCS | Bone Dry Last Scan | Avg (lbs/msf)",
    shortName: "Avg (lbs/msf)",
    lastValue: "20.7 lbs/MSF",
    unit: "lbs/MSF",
    processes: ["Others", "Quality"],
    upperThreshold: 21.5,
    lowerThreshold: 19.9,
    historicalData: [],
  },
  {
    id: 18,
    name: "Rush Drag Current | HBVOITH1:RDCR",
    shortName: "HBVOITH1:RDCR",
    lastValue: "-20.5 FPM",
    unit: "FPM",
    processes: ["Wet End", "Quality"],
    upperThreshold: -3.8,
    lowerThreshold: -37.3,
    historicalData: [],
  },
  {
    id: 19,
    name: "Wet Suction Box No.1 Sep Outlet Pressure Control Valve | PIC-2166-204B",
    shortName: "PIC-2166-204B",
    lastValue: "3.7 psi",
    unit: "psi",
    processes: ["Wet End", "Quality"],
    upperThreshold: 7.2,
    lowerThreshold: 0.2,
    historicalData: [],
  },
  {
    id: 20,
    name: "QCS | CONCORA | Avg",
    shortName: "Avg",
    lastValue: "44.7 lbs",
    unit: "lbs",
    processes: ["Others", "Quality"],
    upperThreshold: 50.2,
    lowerThreshold: 39.2,
    historicalData: [],
  },
  {
    id: 21,
    name: "Headbox Stilling Chamber Pressure Indication | PI-2362-430",
    shortName: "PI-2362-430",
    lastValue: "14.0 psi",
    unit: "psi",
    processes: ["Wet End", "Quality"],
    upperThreshold: 15.6,
    lowerThreshold: 12.4,
    historicalData: [],
  },
  {
    id: 22,
    name: "Average Headbox Differential Pressure Indication | PDI-2362-440 (psi )",
    shortName: "PDI-2362-440 (psi )",
    lastValue: "22.0 psi",
    unit: "psi",
    processes: ["Wet End", "Others", "Quality"],
    upperThreshold: 25.3,
    lowerThreshold: 18.7,
    historicalData: [],
  },
  {
    id: 23,
    name: "PM Dilution Screen Accepts Pressure Indication | PI-2123-102",
    shortName: "PI-2123-102",
    lastValue: "48.0 psi",
    unit: "psi",
    processes: ["Wet End", "Quality"],
    upperThreshold: 51.8,
    lowerThreshold: 44.2,
    historicalData: [],
  },
  {
    id: 24,
    name: "Suction Pick Up Roll-Holding Zones Pres Ctrl | PIC-2365-490",
    shortName: "PIC-2365-490",
    lastValue: "-19.0 psi",
    unit: "psi",
    processes: ["Press", "Quality"],
    upperThreshold: -15.0,
    lowerThreshold: -23.0,
    historicalData: [],
  },
  {
    id: 25,
    name: "Second Press Draw (fpm)",
    shortName: "Second Press Draw (f",
    lastValue: "32.5 FPM",
    unit: "FPM",
    processes: ["Press", "Quality"],
    upperThreshold: 36.5,
    lowerThreshold: 28.4,
    historicalData: [],
  },
  {
    id: 26,
    name: "Rejects Collection  Tank Level  Control  | LIC-2017-507",
    shortName: "LIC-2017-507",
    lastValue: "103.9 %",
    unit: "%",
    processes: ["Stock preparation", "Others", "Cost"],
    upperThreshold: 141.5,
    lowerThreshold: 66.3,
    historicalData: [],
  },
  {
    id: 27,
    name: "Mill Basin Level Indication | LI-2005-501 (%)",
    shortName: "LI-2005-501 (%)",
    lastValue: "89.0 %",
    unit: "%",
    processes: ["Others", "Cost"],
    upperThreshold: 108.9,
    lowerThreshold: 69.1,
    historicalData: [],
  },
  {
    id: 28,
    name: "Average Clear Water Storage Tank Overflow Flow  Control | FIC-2035-702",
    shortName: "FIC-2035-702",
    lastValue: "25.0 GPM",
    unit: "GPM",
    processes: ["Others", "Cost"],
    upperThreshold: 46.0,
    lowerThreshold: 4.0,
    historicalData: [],
  },
  {
    id: 29,
    name: "Effluent Clarifier Inlet  Flow Control | FIC-2005-504",
    shortName: "FIC-2005-504",
    lastValue: "1003.5 GPM",
    unit: "GPM",
    processes: ["Others", "Cost"],
    upperThreshold: 1811.0,
    lowerThreshold: 196.0,
    historicalData: [],
  },
  {
    id: 30,
    name: "MSD Effluent Discharge East | FI-3072 (gpm)",
    shortName: "FI-3072 (gpm)",
    lastValue: "1012.1 GPM",
    unit: "GPM",
    processes: ["Others", "Cost", "Production"],
    upperThreshold: 1923.3,
    lowerThreshold: 101.0,
    historicalData: [],
  },
  {
    id: 31,
    name: "Headbox Static Head Control | PIC-2362-407",
    shortName: "PIC-2362-407",
    lastValue: "281.5 psi",
    unit: "psi",
    processes: ["Wet End", "Quality"],
    upperThreshold: 314.0,
    lowerThreshold: 249.0,
    historicalData: [],
  },
  {
    id: 32,
    name: "Headbox Dilution Distribution Pipe Pressure Indication | PI-2362-431",
    shortName: "PI-2362-431",
    lastValue: "37.0 psi",
    unit: "psi",
    processes: ["Wet End", "Quality"],
    upperThreshold: 40.7,
    lowerThreshold: 33.3,
    historicalData: [],
  },
  {
    id: 33,
    name: "Headbox Flow | HBVOITH1:QTOT",
    shortName: "HBVOITH1:QTOT",
    lastValue: "15850.5 GPM",
    unit: "GPM",
    processes: ["Wet End", "Quality", "Production"],
    upperThreshold: 16735.0,
    lowerThreshold: 14966.0,
    historicalData: [],
  },
  {
    id: 34,
    name: "Dilution Header Flow Ratio Control | FFIC-2362-406",
    shortName: "FFIC-2362-406",
    lastValue: "2020.5 %",
    unit: "%",
    processes: ["Wet End", "Quality"],
    upperThreshold: 2208.0,
    lowerThreshold: 1833.0,
    historicalData: [],
  },
  {
    id: 35,
    name: "Uhle box total flow",
    shortName: "Uhle box total flow",
    lastValue: "255.7 GPM",
    unit: "GPM",
    processes: ["Press", "Production"],
    upperThreshold: 461.1,
    lowerThreshold: 50.3,
    historicalData: [],
  },
  {
    id: 36,
    name: "Pickup felt Uhle flow",
    shortName: "Pickup felt Uhle flo",
    lastValue: "127.3 GPM",
    unit: "GPM",
    processes: ["Press", "Production"],
    upperThreshold: 243.6,
    lowerThreshold: 11.1,
    historicalData: [],
  },
  {
    id: 37,
    name: "2nd Top Felt Uhle Box Flow | FI-2336-131",
    shortName: "FI-2336-131",
    lastValue: "43.4 GPM",
    unit: "GPM",
    processes: ["Press", "Production"],
    upperThreshold: 79.1,
    lowerThreshold: 7.8,
    historicalData: [],
  },
  {
    id: 38,
    name: "Uhle box Collection Tank Compartment #3 Level indication",
    shortName: "Uhle box Collection ",
    lastValue: "62.0 %",
    unit: "%",
    processes: ["Press", "Production"],
    upperThreshold: 84.4,
    lowerThreshold: 39.6,
    historicalData: [],
  },
  {
    id: 39,
    name: "2nd Press Nip Dewatering",
    shortName: "2nd Press Nip Dewate",
    lastValue: "81.8 GPM",
    unit: "GPM",
    processes: ["Press", "Production"],
    upperThreshold: 123.1,
    lowerThreshold: 40.6,
    historicalData: [],
  },
  {
    id: 40,
    name: "QCS | TSI MD/CD AL | Avg",
    shortName: "Avg",
    lastValue: "2.1 Ratio",
    unit: "Ratio",
    processes: ["Others", "Quality"],
    upperThreshold: 2.6,
    lowerThreshold: 1.7,
    historicalData: [],
  },
  {
    id: 41,
    name: "Step Foil Box No.3 Sep Outlet Press Control | PIC-2166-214B",
    shortName: "PIC-2166-214B",
    lastValue: "12.7 psi",
    unit: "psi",
    processes: ["Wet End", "Quality"],
    upperThreshold: 20.1,
    lowerThreshold: 5.3,
    historicalData: [],
  },
  {
    id: 42,
    name: "First Press Draw % (%)",
    shortName: "First Press Draw % (",
    lastValue: "0.2 %",
    unit: "%",
    processes: ["Press", "Quality"],
    upperThreshold: 0.4,
    lowerThreshold: 0.0,
    historicalData: [],
  },
  {
    id: 43,
    name: "After Dryer Draw % (%)",
    shortName: "After Dryer Draw % (",
    lastValue: "0.1 %",
    unit: "%",
    processes: ["Drying", "Quality"],
    upperThreshold: 0.3,
    lowerThreshold: 0.0,
    historicalData: [],
  },
  {
    id: 44,
    name: "Production Rate TPH",
    shortName: "Production Rate TPH",
    lastValue: "33.6 TPH",
    unit: "TPH",
    processes: [
      "Stock preparation",
      "Wet End",
      "Press",
      "Drying",
      "Cost",
      "Production",
    ],
    upperThreshold: 35.2,
    lowerThreshold: 32.0,
    historicalData: [],
  },
  {
    id: 45,
    name: "steam per ton",
    shortName: "steam per ton",
    lastValue: "2864.5 lb/ton",
    unit: "lb/ton",
    processes: ["Drying", "Production"],
    upperThreshold: 3498.0,
    lowerThreshold: 2231.0,
    historicalData: [],
  },
  {
    id: 46,
    name: "Tertiary Fine Screen Dilution Flow Transmitter  | FIC-2017-543",
    shortName: "FIC-2017-543",
    lastValue: "159.0 GPM",
    unit: "GPM",
    processes: ["Stock preparation", "Cost"],
    upperThreshold: 193.0,
    lowerThreshold: 125.0,
    historicalData: [],
  },
  {
    id: 47,
    name: "Dual Zone Wet Suction Box No.1 Separator Outlet Pressure Control MV | PIC-2032-612 MV (%)",
    shortName: "PIC-2032-612 MV (%)",
    lastValue: "40.0 psi",
    unit: "psi",
    processes: ["Wet End", "Cost"],
    upperThreshold: 47.0,
    lowerThreshold: 33.0,
    historicalData: [],
  },
  {
    id: 48,
    name: "Refiner No.1 Outlet Pressure Indication | PI-2018-202A (psi)",
    shortName: "PI-2018-202A (psi)",
    lastValue: "51.5 psi",
    unit: "psi",
    processes: ["Refining", "Cost"],
    upperThreshold: 63.0,
    lowerThreshold: 40.0,
    historicalData: [],
  },
  {
    id: 49,
    name: "First Press Draw (fpm)",
    shortName: "First Press Draw (fp",
    lastValue: "5.5 FPM",
    unit: "FPM",
    processes: ["Press", "Cost"],
    upperThreshold: 11.0,
    lowerThreshold: 0.0,
    historicalData: [],
  },
  {
    id: 50,
    name: "Heat Recovery P.V. Fan No.2 Steam Coils Inlet Temperature Control | TIC-8075-201",
    shortName: "TIC-8075-201",
    lastValue: "197.5 °F",
    unit: "°F",
    processes: ["Drying", "Cost"],
    upperThreshold: 217.0,
    lowerThreshold: 178.0,
    historicalData: [],
  },
  {
    id: 51,
    name: "Refiner No.1 Inlet Pressure Indication | PI-2123-228 (psi)",
    shortName: "PI-2123-228 (psi)",
    lastValue: "40.5 psi",
    unit: "psi",
    processes: ["Refining", "Cost"],
    upperThreshold: 49.0,
    lowerThreshold: 32.0,
    historicalData: [],
  },
  {
    id: 52,
    name: "Second Section Draw (fpm)",
    shortName: "Second Section Draw ",
    lastValue: "6.5 FPM",
    unit: "FPM",
    processes: ["Drying", "Cost"],
    upperThreshold: 9.0,
    lowerThreshold: 4.0,
    historicalData: [],
  },
  {
    id: 53,
    name: "Quaternary Forward Cleaners Rejects Flow Indication | FI-2118-209 (gpm)",
    shortName: "FI-2118-209 (gpm)",
    lastValue: "207.0 GPM",
    unit: "GPM",
    processes: ["Wet End", "Cost"],
    upperThreshold: 332.0,
    lowerThreshold: 82.0,
    historicalData: [],
  },
  {
    id: 54,
    name: "Primary Reverse Flow Cleaners Flow Indication | FI-2022-111 (gpm)",
    shortName: "FI-2022-111 (gpm)",
    lastValue: "13530.0 GPM",
    unit: "GPM",
    processes: ["Stock preparation", "Cost"],
    upperThreshold: 14625.0,
    lowerThreshold: 12435.0,
    historicalData: [],
  },
  {
    id: 55,
    name: "PM Excess WW Chest Level Indication | LI-2118-201 (%)",
    shortName: "LI-2118-201 (%)",
    lastValue: "32.0 %",
    unit: "%",
    processes: ["Stock preparation", "Cost"],
    upperThreshold: 46.9,
    lowerThreshold: 17.1,
    historicalData: [],
  },
  {
    id: 56,
    name: "Spill Containment Tank Level Control | LIC-2021-207",
    shortName: "LIC-2021-207",
    lastValue: "14.6 %",
    unit: "%",
    processes: ["Stock preparation", "Cost"],
    upperThreshold: 29.2,
    lowerThreshold: 0.0,
    historicalData: [],
  },
  {
    id: 57,
    name: "Vacuum Sump Pit Level Control   | LIC-2336-103",
    shortName: "LIC-2336-103",
    lastValue: "-3.6 %",
    unit: "%",
    processes: ["Wet End", "Cost"],
    upperThreshold: -0.4,
    lowerThreshold: -6.8,
    historicalData: [],
  },
  {
    id: 58,
    name: "Canal Water Collection Tank Temperature Indiction | TI-2035-606 (deg F)",
    shortName: "TI-2035-606 (deg F)",
    lastValue: "77.5 °F",
    unit: "°F",
    processes: ["Others", "Cost"],
    upperThreshold: 105.8,
    lowerThreshold: 49.2,
    historicalData: [],
  },
  {
    id: 59,
    name: "Atlas Copco Air Compressor Inlet Flow Transmitter | FI-8033-112 (gpm)",
    shortName: "FI-8033-112 (gpm)",
    lastValue: "65.0 GPM",
    unit: "GPM",
    processes: ["Others", "Cost"],
    upperThreshold: 94.3,
    lowerThreshold: 35.6,
    historicalData: [],
  },
  {
    id: 60,
    name: "Cooling Filtrate Water Pressure Control | PIC-6928-101",
    shortName: "PIC-6928-101",
    lastValue: "57.8 psi",
    unit: "psi",
    processes: ["Others", "Cost"],
    upperThreshold: 61.0,
    lowerThreshold: 54.6,
    historicalData: [],
  },
  {
    id: 61,
    name: "Deculator Pressure Indication | PI-2118-206 (inHg)",
    shortName: "PI-2118-206 (inHg)",
    lastValue: "20.0 inHg",
    unit: "inHg",
    processes: ["Wet End", "Cost"],
    upperThreshold: 28.8,
    lowerThreshold: 11.2,
    historicalData: [],
  },
  {
    id: 62,
    name: "IR Compressor Cooling Water Flow Indication | FI-8033-107 (gpm)",
    shortName: "FI-8033-107 (gpm)",
    lastValue: "79.4 GPM",
    unit: "GPM",
    processes: ["Others", "Cost"],
    upperThreshold: 123.1,
    lowerThreshold: 35.7,
    historicalData: [],
  },
  {
    id: 63,
    name: "Tertiary Fine Screen Rejects Flow Control  | FFIC-2017-403A (gpm)",
    shortName: "FFIC-2017-403A (gpm)",
    lastValue: "171.8 GPM",
    unit: "GPM",
    processes: ["Stock preparation", "Cost"],
    upperThreshold: 281.8,
    lowerThreshold: 61.7,
    historicalData: [],
  },
  {
    id: 64,
    name: "Refiner Outlet Freeness | AIC-2123-230 (CSF)",
    shortName: "AIC-2123-230 (CSF)",
    lastValue: "439.0 CSF",
    unit: "CSF",
    processes: ["Refining", "Production"],
    upperThreshold: 644.6,
    lowerThreshold: 233.4,
    historicalData: [],
  },
  {
    id: 65,
    name: "Concora Predicted-Raw",
    shortName: "Concora Predicted-Ra",
    lastValue: "45.2 lbs",
    unit: "lbs",
    processes: ["Others", "Quality"],
    upperThreshold: 53.5,
    lowerThreshold: 36.9,
    historicalData: [],
  },
  {
    id: 66,
    name: "RCT Predicted",
    shortName: "RCT Predicted",
    lastValue: "28.7 lbs",
    unit: "lbs",
    processes: ["Others", "Quality"],
    upperThreshold: 34.6,
    lowerThreshold: 22.8,
    historicalData: [],
  },
];

export default processVariables;
