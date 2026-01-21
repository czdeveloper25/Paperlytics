#!/usr/bin/env python3
"""
SCT Data Generator Script
Generates synthetic time-series data for SCT monitoring
Output: sct_du_abnormal.csv
"""

import sys
import os

# Print current working directory and script location
print("=" * 80)
print("SCT DATA GENERATOR")
print("=" * 80)
print(f"Script location: {os.path.abspath(__file__)}")
print(f"Current working directory: {os.getcwd()}")
print(f"Python version: {sys.version}")
print("=" * 80)

# Try to import required packages
try:
    import pandas as pd
    print("✓ pandas imported successfully")
except ImportError as e:
    print(f"✗ ERROR: Failed to import pandas")
    print(f"  {str(e)}")
    print("\nTo fix this, run:")
    print("  pip3 install pandas")
    sys.exit(1)

try:
    import numpy as np
    print("✓ numpy imported successfully")
except ImportError as e:
    print(f"✗ ERROR: Failed to import numpy")
    print(f"  {str(e)}")
    print("\nTo fix this, run:")
    print("  pip3 install numpy")
    sys.exit(1)

from datetime import datetime, timedelta
import random

print("✓ All dependencies imported successfully\n")

# Set random seed for reproducibility
np.random.seed(42)

# Configuration
UPPER_THRESHOLD = 13.0
LOWER_THRESHOLD = 7.4
num_minutes = 1440  # 24 hours

start_time = datetime(2025, 8, 9, 0, 0, 0)

print(f"Generating data...")
print(f"  Time range: {num_minutes} minutes ({num_minutes/60:.1f} hours)")
print(f"  Start time: {start_time}")
print(f"  Thresholds: {LOWER_THRESHOLD} - {UPPER_THRESHOLD}\n")

# Generate timestamps
timestamps = [start_time + timedelta(minutes=i) for i in range(num_minutes)]

# Generate SCT values with irregular patterns
sct_values = []

# Start with a base value
base_value = (UPPER_THRESHOLD + LOWER_THRESHOLD) / 2
current_value = base_value

# Generate values within bounds for all except the last one
for i in range(num_minutes - 1):
    # Create irregular data with trend and random walk
    # Random walk component
    random_walk = np.random.normal(0, 0.05)

    # Occasional jumps/dips every ~30-60 minutes
    if i % random.randint(30, 60) == 0:
        jump = np.random.normal(0, 0.5)
        current_value += jump

    # Gradual trend component (creates waves)
    trend = 0.3 * np.sin(2 * np.pi * i / 180) + 0.2 * np.sin(2 * np.pi * i / 360)

    # Combine components
    current_value = current_value + random_walk + trend * 0.1

    # Add occasional spikes
    if random.random() < 0.01:  # 1% chance of spike
        spike = np.random.uniform(-1.0, 1.0)
        current_value += spike

    # Ensure it stays within bounds (with some margin)
    current_value = max(LOWER_THRESHOLD + 0.2, min(UPPER_THRESHOLD - 0.2, current_value))

    sct_values.append(round(current_value, 2))

# Generate the last value that is definitely out of bounds
# Randomly choose whether to go above upper threshold or below lower threshold
if random.choice([True, False]):
    # Go above upper threshold
    last_value = np.random.uniform(UPPER_THRESHOLD + 0.5, UPPER_THRESHOLD + 2.0)
    print(f"Last value will be ABOVE upper threshold: {round(last_value, 2)}")
else:
    # Go below lower threshold
    last_value = np.random.uniform(LOWER_THRESHOLD - 2.0, LOWER_THRESHOLD - 0.5)
    print(f"Last value will be BELOW lower threshold: {round(last_value, 2)}")

sct_values.append(round(last_value, 2))

# Create DataFrame
try:
    df = pd.DataFrame({
        'Timestamp': timestamps,
        'SCT': sct_values,
        'Upper_Threshold': UPPER_THRESHOLD,
        'Lower_Threshold': LOWER_THRESHOLD
    })
    print("✓ DataFrame created successfully\n")
except Exception as e:
    print(f"✗ ERROR: Failed to create DataFrame")
    print(f"  {str(e)}")
    sys.exit(1)

# Save to CSV
filename = 'sct_du_abnormal.csv'
output_path = os.path.join(os.getcwd(), filename)

try:
    df.to_csv(filename, index=False)
    print(f"✓ CSV file saved successfully!")
    print(f"  Location: {output_path}")
    print(f"  Filename: {filename}\n")
except Exception as e:
    print(f"✗ ERROR: Failed to save CSV file")
    print(f"  {str(e)}")
    sys.exit(1)

# Print summary
print("=" * 80)
print("DATA SUMMARY")
print("=" * 80)
print(f"Start Time: {timestamps[0]}")
print(f"End Time: {timestamps[-1]}")
print(f"Total minutes: {num_minutes} ({num_minutes/60:.1f} hours)")
print(f"Upper Threshold: {UPPER_THRESHOLD}")
print(f"Lower Threshold: {LOWER_THRESHOLD}")
print(f"Min SCT Value: {df['SCT'].min()}")
print(f"Max SCT Value: {df['SCT'].max()}")
print(f"Mean SCT Value: {df['SCT'].mean():.2f}")
print(f"Std Dev: {df['SCT'].std():.2f}")

print(f"\nFirst 5 rows:")
print(df.head())
print(f"\nLast 5 rows:")
print(df.tail())

# Check for out-of-bounds values
out_of_bounds = df[(df['SCT'] > UPPER_THRESHOLD) | (df['SCT'] < LOWER_THRESHOLD)]
print(f"\nOut of bounds values count: {len(out_of_bounds)}")
if len(out_of_bounds) > 0:
    print("\nOut of bounds values:")
    print(out_of_bounds[['Timestamp', 'SCT']])

# Additional statistics
print(f"\nData Statistics:")
print(f"Values near upper threshold (> {UPPER_THRESHOLD - 0.5}): {len(df[df['SCT'] > UPPER_THRESHOLD - 0.5])}")
print(f"Values near lower threshold (< {LOWER_THRESHOLD + 0.5}): {len(df[df['SCT'] < LOWER_THRESHOLD + 0.5])}")

print("\n" + "=" * 80)
print("✓ GENERATION COMPLETE!")
print("=" * 80)

if __name__ == "__main__":
    print(f"\nScript executed successfully from: {__file__}")
