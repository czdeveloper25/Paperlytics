/**
 * Generate mock historical data for chart visualization
 * @param {Object} variable - The process variable object
 * @param {String} timeRange - 'Hour', 'Day', 'Week', or 'Month'
 * @param {String} dataSource - 'normal' or 'abnormal'
 * @returns {Array} Array of data points with timestamp, value, and status
 */
export const generateHistoricalData = (variable, timeRange, dataSource) => {
  // Extract numeric value from variable's lastValue string
  const currentValue = parseFloat(variable.lastValue);
  const { upperThreshold, lowerThreshold } = variable;
  const range = upperThreshold - lowerThreshold;

  // Determine number of data points and time increment based on range
  let dataPoints, timeIncrement, timeUnit;
  const now = new Date();

  switch (timeRange) {
    case "Hour":
      dataPoints = 60; // 1 per minute
      timeIncrement = 60 * 1000; // 1 minute in milliseconds
      timeUnit = "minute";
      break;
    case "Day":
      dataPoints = 24; // 1 per hour
      timeIncrement = 60 * 60 * 1000; // 1 hour in milliseconds
      timeUnit = "hour";
      break;
    case "Week":
      dataPoints = 7; // 1 per day
      timeIncrement = 24 * 60 * 60 * 1000; // 1 day in milliseconds
      timeUnit = "day";
      break;
    case "Month":
      dataPoints = 30; // 1 per day
      timeIncrement = 24 * 60 * 60 * 1000; // 1 day in milliseconds
      timeUnit = "day";
      break;
    default:
      dataPoints = 24;
      timeIncrement = 60 * 60 * 1000;
      timeUnit = "hour";
  }

  const data = [];

  // Generate data points going backwards in time
  for (let i = dataPoints - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * timeIncrement);
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
      if (Math.random() > 0.9) {
        // 10% chance of being near upper threshold
        value = upperThreshold - Math.random() * range * 0.1;
      } else if (Math.random() > 0.9) {
        // 10% chance of being near lower threshold
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
    shortName: "DRV39",
    lastValue: "1250 fpm",
    unit: "fpm",
    processes: ["Wet End", "Press", "Drying", "Quality", "Cost", "Production"],
    upperThreshold: 1500,
    lowerThreshold: 1000,
    historicalData: [],
  },
  {
    id: 2,
    name: "Production Rate TPH",
    shortName: "Prod Rate",
    lastValue: "45.2 TPH",
    unit: "TPH",
    processes: [
      "Stock preparation",
      "Wet End",
      "Press",
      "Drying",
      "Cost",
      "Production",
    ],
    upperThreshold: 50,
    lowerThreshold: 40,
    historicalData: [],
  },
  {
    id: 3,
    name: "Now BW | FR1_BW1_CURV:ROUT",
    shortName: "BW",
    lastValue: "95.2 lbs/msf",
    unit: "lbs/msf",
    processes: ["Others", "Quality"],
    upperThreshold: 100,
    lowerThreshold: 90,
    historicalData: [],
  },
  {
    id: 4,
    name: "3rd Dryer Section Pressure Control | PIC-2367-120",
    shortName: "PIC-2367-120",
    lastValue: "11.2 psi", // Changed to exceed upper threshold for warning demo
    unit: "psi",
    processes: ["Drying", "Quality", "Cost"],
    upperThreshold: 10,
    lowerThreshold: 7,
    historicalData: [],
  },
  {
    id: 5,
    name: "TAPPI Drying Rate-32 Cans",
    shortName: "TAPPI Rate",
    lastValue: "125 lbs/hr",
    unit: "lbs/hr",
    processes: ["Drying", "Production"],
    upperThreshold: 150,
    lowerThreshold: 100,
    historicalData: [],
  },
  {
    id: 6,
    name: "Stock Storage Tower Level Indication | LI-2180-101",
    shortName: "LI-2180-101",
    lastValue: "75.3 %",
    unit: "%",
    processes: ["Stock preparation", "Production"],
    upperThreshold: 90,
    lowerThreshold: 60,
    historicalData: [],
  },
  {
    id: 7,
    name: "Stock Production | TPH (TPH)",
    shortName: "Stock TPH",
    lastValue: "48.7 TPH",
    unit: "TPH",
    processes: ["Stock preparation", "Production"],
    upperThreshold: 55,
    lowerThreshold: 45,
    historicalData: [],
  },
  {
    id: 8,
    name: "Primary Coarse Screen Accepts Flow Control | FFIC-2024-112",
    shortName: "FFIC-2024-112",
    lastValue: "1850 gpm",
    unit: "gpm",
    processes: ["Stock preparation", "Production"],
    upperThreshold: 2000,
    lowerThreshold: 1700,
    historicalData: [],
  },
  {
    id: 9,
    name: "Secondary Coarse Screen Accepts Flow | FI-2017-203B",
    shortName: "FI-2017-203B",
    lastValue: "1620 gpm",
    unit: "gpm",
    processes: ["Stock preparation", "Production"],
    upperThreshold: 1800,
    lowerThreshold: 1500,
    historicalData: [],
  },
  {
    id: 10,
    name: "SEC For Refiners (New)",
    shortName: "SEC Refiners",
    lastValue: "145 kWh/t",
    unit: "kWh/t",
    processes: ["Refining", "Quality", "Production"],
    upperThreshold: 160,
    lowerThreshold: 130,
    historicalData: [],
  },
  {
    id: 11,
    name: "Refiner recirc %",
    shortName: "Refiner Recirc",
    lastValue: "35 %",
    unit: "%",
    processes: ["Refining", "Quality", "Production"],
    upperThreshold: 40,
    lowerThreshold: 30,
    historicalData: [],
  },
  {
    id: 12,
    name: "Refiner No.1 kW/hr | JIC-2123-211",
    shortName: "JIC-2123-211",
    lastValue: "850 kW",
    unit: "kW",
    processes: ["Refining", "Cost"],
    upperThreshold: 950,
    lowerThreshold: 750,
    historicalData: [],
  },
  {
    id: 13,
    name: "Refiner No.2 kW/hr | JIC-2123-221",
    shortName: "JIC-2123-221",
    lastValue: "680 kW", // Changed to below lower threshold for warning demo
    unit: "kW",
    processes: ["Refining", "Cost"],
    upperThreshold: 950,
    lowerThreshold: 750,
    historicalData: [],
  },
  {
    id: 14,
    name: "Refiners #1 Outlet Flow Control PV | FFIC-2123-242",
    shortName: "FFIC-2123-242",
    lastValue: "925 gpm",
    unit: "gpm",
    processes: ["Refining", "Quality"],
    upperThreshold: 1000,
    lowerThreshold: 850,
    historicalData: [],
  },
  {
    id: 15,
    name: "Refiners #2 Outlet Flow Control PV | FFIC-2123-243",
    shortName: "FFIC-2123-243",
    lastValue: "940 gpm",
    unit: "gpm",
    processes: ["Refining", "Quality"],
    upperThreshold: 1000,
    lowerThreshold: 850,
    historicalData: [],
  },
  {
    id: 16,
    name: "QCS | RCT | Avg",
    shortName: "RCT Avg",
    lastValue: "45.8 lbs",
    unit: "lbs",
    processes: ["Others", "Quality"],
    upperThreshold: 50,
    lowerThreshold: 40,
    historicalData: [],
  },
  {
    id: 17,
    name: "QCS | Bone Dry Last Scan | Avg (lbs/msf)",
    shortName: "Bone Dry Avg",
    lastValue: "92.5 lbs/msf",
    unit: "lbs/msf",
    processes: ["Others", "Quality"],
    upperThreshold: 100,
    lowerThreshold: 85,
    historicalData: [],
  },
  {
    id: 18,
    name: "Rush Drag Current | HBVOITH1:RDCR",
    shortName: "RDCR",
    lastValue: "12.5 A",
    unit: "A",
    processes: ["Wet End", "Quality"],
    upperThreshold: 15,
    lowerThreshold: 10,
    historicalData: [],
  },
  {
    id: 19,
    name: "Wet Suction Box No.1 Sep Outlet Pressure Control Valve | PIC-2166-204B",
    shortName: "PIC-2166-204B",
    lastValue: "6.2 inHg",
    unit: "inHg",
    processes: ["Wet End", "Quality"],
    upperThreshold: 8,
    lowerThreshold: 5,
    historicalData: [],
  },
  {
    id: 20,
    name: "QCS | CONCORA | Avg",
    shortName: "CONCORA Avg",
    lastValue: "185 lbs",
    unit: "lbs",
    processes: ["Others", "Quality"],
    upperThreshold: 200,
    lowerThreshold: 170,
    historicalData: [],
  },
  {
    id: 21,
    name: "Headbox Stilling Chamber Pressure Indication | PI-2362-430",
    shortName: "PI-2362-430",
    lastValue: "8.5 psi",
    unit: "psi",
    processes: ["Wet End", "Quality"],
    upperThreshold: 10,
    lowerThreshold: 7,
    historicalData: [],
  },
  {
    id: 22,
    name: "Average Headbox Differential Pressure Indication | PDI-2362-440 (psi )",
    shortName: "PDI-2362-440",
    lastValue: "2.8 psi",
    unit: "psi",
    processes: ["Wet End", "Others", "Quality"],
    upperThreshold: 3.5,
    lowerThreshold: 2,
    historicalData: [],
  },
  {
    id: 23,
    name: "PM Dilution Screen Accepts Pressure Indication | PI-2123-102",
    shortName: "PI-2123-102",
    lastValue: "15.2 psi",
    unit: "psi",
    processes: ["Wet End", "Quality"],
    upperThreshold: 18,
    lowerThreshold: 12,
    historicalData: [],
  },
  {
    id: 24,
    name: "Suction Pick Up Roll-Holding Zones Pres Ctrl | PIC-2365-490",
    shortName: "PIC-2365-490",
    lastValue: "5.5 inHg",
    unit: "inHg",
    processes: ["Press", "Quality"],
    upperThreshold: 7,
    lowerThreshold: 4,
    historicalData: [],
  },
  {
    id: 25,
    name: "Second Press Draw (fpm)",
    shortName: "2nd Press Draw",
    lastValue: "1275 fpm",
    unit: "fpm",
    processes: ["Press", "Quality"],
    upperThreshold: 1400,
    lowerThreshold: 1200,
    historicalData: [],
  },
  {
    id: 26,
    name: "Rejects Collection  Tank Level  Control  | LIC-2017-507",
    shortName: "LIC-2017-507",
    lastValue: "68 %",
    unit: "%",
    processes: ["Stock preparation", "Others", "Cost"],
    upperThreshold: 85,
    lowerThreshold: 50,
    historicalData: [],
  },
  {
    id: 27,
    name: "Mill Basin Level Indication | LI-2005-501 (%)",
    shortName: "LI-2005-501",
    lastValue: "72 %",
    unit: "%",
    processes: ["Others", "Cost"],
    upperThreshold: 85,
    lowerThreshold: 60,
    historicalData: [],
  },
  {
    id: 28,
    name: "Average Clear Water Storage Tank Overflow Flow  Control | FIC-2035-702",
    shortName: "FIC-2035-702",
    lastValue: "350 gpm",
    unit: "gpm",
    processes: ["Others", "Cost"],
    upperThreshold: 400,
    lowerThreshold: 300,
    historicalData: [],
  },
  {
    id: 29,
    name: "Effluent Clarifier Inlet  Flow Control | FIC-2005-504",
    shortName: "FIC-2005-504",
    lastValue: "825 gpm",
    unit: "gpm",
    processes: ["Others", "Cost"],
    upperThreshold: 900,
    lowerThreshold: 750,
    historicalData: [],
  },
  {
    id: 30,
    name: "MSD Effluent Discharge East | FI-3072 (gpm)",
    shortName: "FI-3072",
    lastValue: "450 gpm",
    unit: "gpm",
    processes: ["Others", "Cost", "Production"],
    upperThreshold: 500,
    lowerThreshold: 400,
    historicalData: [],
  },
  {
    id: 31,
    name: "Headbox Static Head Control | PIC-2362-407",
    shortName: "PIC-2362-407",
    lastValue: "35 in", // Changed to below lower threshold for warning demo
    unit: "in",
    processes: ["Wet End", "Quality"],
    upperThreshold: 45,
    lowerThreshold: 38,
    historicalData: [],
  },
  {
    id: 32,
    name: "Headbox Dilution Distribution Pipe Pressure Indication | PI-2362-431",
    shortName: "PI-2362-431",
    lastValue: "18.5 psi",
    unit: "psi",
    processes: ["Wet End", "Quality"],
    upperThreshold: 22,
    lowerThreshold: 15,
    historicalData: [],
  },
  {
    id: 33,
    name: "Headbox Flow | HBVOITH1:QTOT",
    shortName: "HB Flow",
    lastValue: "2850 gpm",
    unit: "gpm",
    processes: ["Wet End", "Quality", "Production"],
    upperThreshold: 3000,
    lowerThreshold: 2700,
    historicalData: [],
  },
  {
    id: 34,
    name: "Dilution Header Flow Ratio Control | FFIC-2362-406",
    shortName: "FFIC-2362-406",
    lastValue: "0.85 ratio",
    unit: "ratio",
    processes: ["Wet End", "Quality"],
    upperThreshold: 1.0,
    lowerThreshold: 0.7,
    historicalData: [],
  },
  {
    id: 35,
    name: "Uhle box total flow",
    shortName: "Uhle Total",
    lastValue: "185 gpm",
    unit: "gpm",
    processes: ["Press", "Production"],
    upperThreshold: 200,
    lowerThreshold: 160,
    historicalData: [],
  },
  {
    id: 36,
    name: "Pickup felt Uhle flow",
    shortName: "Pickup Uhle",
    lastValue: "65 gpm",
    unit: "gpm",
    processes: ["Press", "Production"],
    upperThreshold: 80,
    lowerThreshold: 50,
    historicalData: [],
  },
  {
    id: 37,
    name: "2nd Top Felt Uhle Box Flow | FI-2336-131",
    shortName: "FI-2336-131",
    lastValue: "72 gpm",
    unit: "gpm",
    processes: ["Press", "Production"],
    upperThreshold: 85,
    lowerThreshold: 60,
    historicalData: [],
  },
  {
    id: 38,
    name: "Uhle box Collection Tank Compartment #3 Level indication",
    shortName: "Uhle Tank Lvl",
    lastValue: "68 %",
    unit: "%",
    processes: ["Press", "Production"],
    upperThreshold: 85,
    lowerThreshold: 50,
    historicalData: [],
  },
  {
    id: 39,
    name: "2nd Press Nip Dewatering",
    shortName: "2nd Nip Dew",
    lastValue: "48 %",
    unit: "%",
    processes: ["Press", "Production"],
    upperThreshold: 55,
    lowerThreshold: 42,
    historicalData: [],
  },
  {
    id: 40,
    name: "QCS | TSI MD/CD AL | Avg",
    shortName: "TSI Avg",
    lastValue: "1.25 ratio",
    unit: "ratio",
    processes: ["Others", "Quality"],
    upperThreshold: 1.5,
    lowerThreshold: 1.0,
    historicalData: [],
  },
  {
    id: 41,
    name: "Step Foil Box No.3 Sep Outlet Press Control | PIC-2166-214B",
    shortName: "PIC-2166-214B",
    lastValue: "5.8 inHg",
    unit: "inHg",
    processes: ["Wet End", "Quality"],
    upperThreshold: 7,
    lowerThreshold: 4,
    historicalData: [],
  },
  {
    id: 42,
    name: "First Press Draw % (%)",
    shortName: "1st Press Draw",
    lastValue: "45 %",
    unit: "%",
    processes: ["Press", "Quality"],
    upperThreshold: 50,
    lowerThreshold: 40,
    historicalData: [],
  },
  {
    id: 43,
    name: "After Dryer Draw % (%)",
    shortName: "After Dryer",
    lastValue: "3.2 %",
    unit: "%",
    processes: ["Drying", "Quality"],
    upperThreshold: 4,
    lowerThreshold: 2,
    historicalData: [],
  },
  {
    id: 44,
    name: "QCS | SCT | Avg",
    shortName: "SCT Avg",
    lastValue: "28.5 lbs",
    unit: "lbs",
    processes: ["Others", "Quality"],
    upperThreshold: 32,
    lowerThreshold: 25,
    historicalData: [],
  },
  {
    id: 45,
    name: "steam per ton",
    shortName: "Steam/Ton",
    lastValue: "2.8 tons",
    unit: "tons",
    processes: ["Drying", "Cost"],
    upperThreshold: 3.2,
    lowerThreshold: 2.5,
    historicalData: [],
  },
  {
    id: 46,
    name: "Tertiary Fine Screen Dilution Flow Transmitter  | FIC-2017-543",
    shortName: "FIC-2017-543",
    lastValue: "125 gpm",
    unit: "gpm",
    processes: ["Stock preparation", "Cost"],
    upperThreshold: 150,
    lowerThreshold: 100,
    historicalData: [],
  },
  {
    id: 47,
    name: "Dual Zone Wet Suction Box No.1 Separator Outlet Pressure Control MV | PIC-2032-612 MV (%)",
    shortName: "PIC-2032-612",
    lastValue: "65 %",
    unit: "%",
    processes: ["Wet End", "Cost"],
    upperThreshold: 80,
    lowerThreshold: 50,
    historicalData: [],
  },
  {
    id: 48,
    name: "Refiner No.1 Outlet Pressure Indication | PI-2018-202A (psi)",
    shortName: "PI-2018-202A",
    lastValue: "22 psi",
    unit: "psi",
    processes: ["Refining", "Cost"],
    upperThreshold: 28,
    lowerThreshold: 18,
    historicalData: [],
  },
  {
    id: 49,
    name: "First Press Draw (fpm)",
    shortName: "1st Press fpm",
    lastValue: "1255 fpm",
    unit: "fpm",
    processes: ["Press", "Cost"],
    upperThreshold: 1400,
    lowerThreshold: 1150,
    historicalData: [],
  },
  {
    id: 50,
    name: "Heat Recovery P.V. Fan No.2 Steam Coils Inlet Temperature Control | TIC-8075-201",
    shortName: "TIC-8075-201",
    lastValue: "185 °F",
    unit: "°F",
    processes: ["Drying", "Cost"],
    upperThreshold: 200,
    lowerThreshold: 170,
    historicalData: [],
  },
  {
    id: 51,
    name: "Refiner No.1 Inlet Pressure Indication | PI-2123-228 (psi)",
    shortName: "PI-2123-228",
    lastValue: "45 psi",
    unit: "psi",
    processes: ["Refining", "Cost"],
    upperThreshold: 55,
    lowerThreshold: 38,
    historicalData: [],
  },
  {
    id: 52,
    name: "Second Section Draw (fpm)",
    shortName: "2nd Section Draw",
    lastValue: "1285 fpm",
    unit: "fpm",
    processes: ["Drying", "Cost"],
    upperThreshold: 1450,
    lowerThreshold: 1200,
    historicalData: [],
  },
  {
    id: 53,
    name: "Quaternary Forward Cleaners Rejects Flow Indication | FI-2118-209 (gpm)",
    shortName: "FI-2118-209",
    lastValue: "45 gpm",
    unit: "gpm",
    processes: ["Wet End", "Cost"],
    upperThreshold: 60,
    lowerThreshold: 35,
    historicalData: [],
  },
  {
    id: 54,
    name: "Primary Reverse Flow Cleaners Flow Indication | FI-2022-111 (gpm)",
    shortName: "FI-2022-111",
    lastValue: "285 gpm",
    unit: "gpm",
    processes: ["Stock preparation", "Cost"],
    upperThreshold: 320,
    lowerThreshold: 250,
    historicalData: [],
  },
  {
    id: 55,
    name: "PM Excess WW Chest Level Indication | LI-2118-201 (%)",
    shortName: "LI-2118-201",
    lastValue: "65 %",
    unit: "%",
    processes: ["Stock preparation", "Cost"],
    upperThreshold: 85,
    lowerThreshold: 50,
    historicalData: [],
  },
  {
    id: 56,
    name: "Spill Containment Tank Level Control | LIC-2021-207",
    shortName: "LIC-2021-207",
    lastValue: "42 %",
    unit: "%",
    processes: ["Stock preparation", "Cost"],
    upperThreshold: 70,
    lowerThreshold: 30,
    historicalData: [],
  },
  {
    id: 57,
    name: "Vacuum Sump Pit Level Control   | LIC-2336-103",
    shortName: "LIC-2336-103",
    lastValue: "58 %",
    unit: "%",
    processes: ["Wet End", "Cost"],
    upperThreshold: 75,
    lowerThreshold: 45,
    historicalData: [],
  },
  {
    id: 58,
    name: "Canal Water Collection Tank Temperature Indiction | TI-2035-606 (deg F)",
    shortName: "TI-2035-606",
    lastValue: "72 °F",
    unit: "°F",
    processes: ["Others", "Cost"],
    upperThreshold: 85,
    lowerThreshold: 65,
    historicalData: [],
  },
  {
    id: 59,
    name: "Atlas Copco Air Compressor Inlet Flow Transmitter | FI-8033-112 (gpm)",
    shortName: "FI-8033-112",
    lastValue: "185 gpm",
    unit: "gpm",
    processes: ["Others", "Cost"],
    upperThreshold: 220,
    lowerThreshold: 160,
    historicalData: [],
  },
  {
    id: 60,
    name: "Cooling Filtrate Water Pressure Control | PIC-6928-101",
    shortName: "PIC-6928-101",
    lastValue: "55 psi",
    unit: "psi",
    processes: ["Others", "Cost"],
    upperThreshold: 65,
    lowerThreshold: 45,
    historicalData: [],
  },
  {
    id: 61,
    name: "Deculator Pressure Indication | PI-2118-206 (inHg)",
    shortName: "PI-2118-206",
    lastValue: "18 inHg",
    unit: "inHg",
    processes: ["Wet End", "Cost"],
    upperThreshold: 22,
    lowerThreshold: 15,
    historicalData: [],
  },
  {
    id: 62,
    name: "IR Compressor Cooling Water Flow Indication | FI-8033-107 (gpm)",
    shortName: "FI-8033-107",
    lastValue: "125 gpm",
    unit: "gpm",
    processes: ["Others", "Cost"],
    upperThreshold: 150,
    lowerThreshold: 100,
    historicalData: [],
  },
  {
    id: 63,
    name: "Tertiary Fine Screen Rejects Flow Control  | FFIC-2017-403A (gpm)",
    shortName: "FFIC-2017-403A",
    lastValue: "38 gpm",
    unit: "gpm",
    processes: ["Stock preparation", "Cost"],
    upperThreshold: 50,
    lowerThreshold: 30,
    historicalData: [],
  },
  {
    id: 64,
    name: "Refiner Outlet Freeness | AIC-2123-230 (CSF)",
    shortName: "AIC-2123-230",
    lastValue: "485 CSF",
    unit: "CSF",
    processes: ["Refining", "Production"],
    upperThreshold: 550,
    lowerThreshold: 450,
    historicalData: [],
  },
  {
    id: 65,
    name: "Concora Predicted-Raw",
    shortName: "Concora Pred",
    lastValue: "188 lbs",
    unit: "lbs",
    processes: ["Others", "Quality"],
    upperThreshold: 205,
    lowerThreshold: 175,
    historicalData: [],
  },
  {
    id: 66,
    name: "RCT Predicted",
    shortName: "RCT Pred",
    lastValue: "46.2 lbs",
    unit: "lbs",
    processes: ["Others", "Quality"],
    upperThreshold: 52,
    lowerThreshold: 42,
    historicalData: [],
  },
];

export default processVariables;
