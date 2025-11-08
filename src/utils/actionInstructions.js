import React from 'react';

/**
 * Get specific action instructions for each variable when in warning state
 * Returns JSX with step-by-step instructions to resolve the issue
 */
export const getActionInstructions = (variable, warningReason) => {
  // Define action instructions for each variable
  const instructions = {
    // NOW BW | FR1_BW1_CURV:ROUT (ID: 3)
    3: {
      'High Warning': [
        'Check stock consistency from machine chest - may be too thick',
        'Verify machine chest pump speed settings and adjust if necessary',
        'Inspect headbox slice opening - may need to be reduced',
        'Review headbox dilution water flow rate',
        'Contact QCS operator to verify feedback loop calibration',
        'Monitor basis weight trend for 5-10 minutes after adjustment'
      ],
      'Low Warning': [
        'Increase stock flow rate from machine chest pump',
        'Check for slice lip wear, damage, or blockage',
        'Verify headbox total pressure is within normal range',
        'Review refiner plate settings - may need more refining',
        'Check consistency measurement sensor accuracy',
        'Ensure proper sheet formation at wire section'
      ]
    },

    // QCS | SCT | Avg (ID: 2)
    2: {
      'High Warning': [
        'Review drying section steam pressure and temperature',
        'Check sheet moisture content - may be too dry affecting strength',
        'Verify refining parameters are not over-refined',
        'Inspect press section loading and felt condition',
        'Check chemical additives (starch, strength agents) dosage'
      ],
      'Low Warning': [
        'Increase refining intensity to improve fiber bonding',
        'Check raw material fiber quality and blend ratios',
        'Review and increase chemical additives if needed',
        'Verify press section nip loading is adequate',
        'Check for contamination in stock preparation'
      ]
    },

    // Production Rate TPH (ID: 1)
    1: {
      'High Warning': [
        'Reduce machine speed to bring TPH within limits',
        'Check if basis weight is lower than target',
        'Verify drying capacity is not exceeded',
        'Monitor steam consumption and availability',
        'Ensure product quality is maintained'
      ],
      'Low Warning': [
        'Increase machine speed if drying capacity allows',
        'Check for breaks or sheet defects causing slowdowns',
        'Verify headbox and wire section operation',
        'Review press section efficiency',
        'Check for any equipment issues limiting speed'
      ]
    },

    // Default instructions for other variables
    default: {
      'High Warning': [
        'Reduce input flow or parameter setting to bring value down',
        'Check equipment and sensor calibration accuracy',
        'Verify readings are consistent across multiple sensors',
        'Review recent process changes that may have caused increase',
        'Contact process engineer if issue persists after adjustments',
        'Document the corrective actions taken'
      ],
      'Low Warning': [
        'Increase input flow or parameter setting to bring value up',
        'Check for blockages, restrictions, or equipment malfunctions',
        'Verify sensor readings are accurate and not stuck',
        'Review recent process changes that may have caused decrease',
        'Contact process engineer if issue persists after adjustments',
        'Document the corrective actions taken'
      ]
    }
  };

  // Get instructions for this specific variable
  const variableInstructions = instructions[variable.id] || instructions.default;
  const steps = variableInstructions[warningReason] || variableInstructions['High Warning'];

  // Return formatted instruction list
  return React.createElement('ul', { className: 'list-none space-y-2' },
    steps.map((step, index) =>
      React.createElement('li', { key: index, className: 'flex items-start gap-2' },
        React.createElement('span', { className: 'text-warning-red font-bold flex-shrink-0' }, '→'),
        React.createElement('span', { className: 'text-sm' }, step)
      )
    )
  );
};

/**
 * Get a short summary of action needed (for sidebar)
 */
export const getActionSummary = (variable, warningReason) => {
  const summaries = {
    3: {
      'High Warning': 'Reduce basis weight - Check stock consistency',
      'Low Warning': 'Increase basis weight - Adjust stock flow'
    },
    2: {
      'High Warning': 'Review drying and refining parameters',
      'Low Warning': 'Increase refining or chemical additives'
    },
    1: {
      'High Warning': 'Reduce machine speed',
      'Low Warning': 'Increase machine speed if capacity allows'
    },
    default: {
      'High Warning': 'Reduce parameter to bring value down',
      'Low Warning': 'Increase parameter to bring value up'
    }
  };

  const variableSummaries = summaries[variable.id] || summaries.default;
  return variableSummaries[warningReason] || variableSummaries['High Warning'];
};
