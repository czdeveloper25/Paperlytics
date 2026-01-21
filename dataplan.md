# Data Architecture Plan - Industrial Monitor

## Overview

This document outlines the secure real-time data architecture for the Industrial Monitor application, designed to handle 69 variables updating every minute from industrial sensors and PLCs.

---

## 1. Architecture Overview

### Data Flow Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Sensors/PLCs  │────▶│  Data Ingestion  │────▶│    Supabase     │────▶│   React App      │
│   (69 vars)     │     │  Script (Python) │     │   (PostgreSQL)  │     │   (Frontend)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘     └──────────────────┘
        │                       │                        │                       │
        │                       │                        │                       │
   OPC-UA/Modbus          Cron (1 min)            Row Level Security      Real-time Subscriptions
   MQTT/HTTP              Error Logging           API Authentication      Protected Dashboard
```

### Separation of Concerns

| Component | Access Level | Description |
|-----------|--------------|-------------|
| Frontend (React) | Public | Static site hosted on Vercel/Netlify |
| Supabase Database | Private | Secured with RLS and API keys |
| Data Script | Server-side | Runs on internal server with sensor access |
| Sensor Network | Internal | Isolated from public internet |

---

## 2. Supabase Setup Guide

### 2.1 Creating a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project"
3. Choose organization and set project name (e.g., `industrial-monitor`)
4. Set a strong database password (save this securely)
5. Select region closest to your deployment

### 2.2 Database Schema

Run these SQL commands in the Supabase SQL Editor:

```sql
-- Create variables table for current readings
CREATE TABLE variables (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(200),
  value NUMERIC,
  unit VARCHAR(50),
  category VARCHAR(100),
  min_threshold NUMERIC,
  max_threshold NUMERIC,
  status VARCHAR(20) DEFAULT 'normal',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create historical readings table
CREATE TABLE readings_history (
  id SERIAL PRIMARY KEY,
  variable_id INTEGER REFERENCES variables(id),
  value NUMERIC,
  status VARCHAR(20),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster historical queries
CREATE INDEX idx_readings_history_variable_time
ON readings_history(variable_id, recorded_at DESC);

-- Create index for variable lookup
CREATE INDEX idx_variables_name ON variables(name);
CREATE INDEX idx_variables_category ON variables(category);

-- Function to update timestamp on variable change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating timestamp
CREATE TRIGGER variables_updated_at
  BEFORE UPDATE ON variables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### 2.3 Insert Initial Variables

```sql
-- Insert your 69 variables (example for a few)
INSERT INTO variables (name, display_name, unit, category, min_threshold, max_threshold) VALUES
  ('boiler_temp_1', 'Boiler Temperature 1', '°C', 'Temperature', 80, 120),
  ('boiler_pressure_1', 'Boiler Pressure 1', 'bar', 'Pressure', 2, 8),
  ('feed_water_flow', 'Feed Water Flow Rate', 'm³/h', 'Flow', 10, 50),
  ('stack_temp', 'Stack Temperature', '°C', 'Temperature', 150, 250),
  ('oxygen_level', 'Oxygen Level', '%', 'Emissions', 2, 6),
  ('co_emission', 'CO Emission', 'ppm', 'Emissions', 0, 100)
  -- Add remaining variables...
;
```

### 2.4 Row Level Security (RLS) Configuration

```sql
-- Enable RLS on tables
ALTER TABLE variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings_history ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read variables
CREATE POLICY "Allow authenticated read access to variables"
ON variables FOR SELECT
TO authenticated
USING (true);

-- Policy: Only service role can insert/update variables
CREATE POLICY "Service role can modify variables"
ON variables FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to read history
CREATE POLICY "Allow authenticated read access to history"
ON readings_history FOR SELECT
TO authenticated
USING (true);

-- Policy: Only service role can insert history
CREATE POLICY "Service role can insert history"
ON readings_history FOR INSERT
TO service_role
WITH CHECK (true);
```

### 2.5 API Keys and Authentication

Supabase provides two keys (found in Project Settings > API):

| Key Type | Use Case | Security |
|----------|----------|----------|
| `anon` key | Frontend client | Safe for browser, limited by RLS |
| `service_role` key | Server-side scripts | **Never expose to client** |

---

## 3. Data Ingestion

### 3.1 Python Script for Data Push

Create `data_ingestion.py`:

```python
#!/usr/bin/env python3
"""
Industrial Monitor - Data Ingestion Script
Pushes sensor data to Supabase every minute
"""

import os
import logging
from datetime import datetime
from typing import Dict, Any, List
from supabase import create_client, Client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/industrial-monitor/ingestion.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Supabase configuration (use environment variables)
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

def get_supabase_client() -> Client:
    """Initialize Supabase client with service role key."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise ValueError("Missing Supabase configuration in environment")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def read_sensor_data() -> Dict[str, Any]:
    """
    Read data from sensors/PLCs.
    Replace this with your actual sensor reading logic.

    Examples:
    - OPC-UA client for industrial PLCs
    - Modbus TCP/RTU for older equipment
    - MQTT subscription for IoT sensors
    - HTTP API calls for smart sensors
    """
    # Example: Replace with actual sensor reading
    sensor_data = {}

    # Option 1: OPC-UA (uncomment and configure)
    # from opcua import Client
    # opc_client = Client("opc.tcp://plc-server:4840")
    # opc_client.connect()
    # node = opc_client.get_node("ns=2;i=1234")
    # sensor_data['boiler_temp_1'] = node.get_value()

    # Option 2: Modbus (uncomment and configure)
    # from pymodbus.client import ModbusTcpClient
    # modbus_client = ModbusTcpClient('192.168.1.100')
    # result = modbus_client.read_holding_registers(0, 10)
    # sensor_data['boiler_temp_1'] = result.registers[0] / 10.0

    # Option 3: Read from CSV (for testing)
    # import csv
    # with open('/path/to/sensor_export.csv', 'r') as f:
    #     reader = csv.DictReader(f)
    #     for row in reader:
    #         sensor_data[row['name']] = float(row['value'])

    return sensor_data

def calculate_status(value: float, min_thresh: float, max_thresh: float) -> str:
    """Determine variable status based on thresholds."""
    if value is None:
        return 'error'
    if value < min_thresh or value > max_thresh:
        return 'critical'
    # Warning zone: within 10% of threshold
    warning_margin = (max_thresh - min_thresh) * 0.1
    if value < min_thresh + warning_margin or value > max_thresh - warning_margin:
        return 'warning'
    return 'normal'

def update_variables(client: Client, sensor_data: Dict[str, Any]) -> None:
    """Update variables table with new sensor readings."""
    # Get current variable definitions (for thresholds)
    variables = client.table('variables').select('*').execute()
    var_map = {v['name']: v for v in variables.data}

    updates = []
    history_records = []

    for name, value in sensor_data.items():
        if name not in var_map:
            logger.warning(f"Unknown variable: {name}")
            continue

        var = var_map[name]
        status = calculate_status(
            value,
            var.get('min_threshold'),
            var.get('max_threshold')
        )

        updates.append({
            'name': name,
            'value': value,
            'status': status
        })

        history_records.append({
            'variable_id': var['id'],
            'value': value,
            'status': status
        })

    # Batch update variables
    for update in updates:
        client.table('variables').update({
            'value': update['value'],
            'status': update['status']
        }).eq('name', update['name']).execute()

    # Insert historical records
    if history_records:
        client.table('readings_history').insert(history_records).execute()

    logger.info(f"Updated {len(updates)} variables")

def cleanup_old_history(client: Client, days_to_keep: int = 30) -> None:
    """Remove historical data older than specified days."""
    cutoff = datetime.now().isoformat()
    # Note: Adjust the date arithmetic based on your needs
    client.rpc('cleanup_old_readings', {'days': days_to_keep}).execute()

def main():
    """Main ingestion loop."""
    try:
        logger.info("Starting data ingestion...")
        client = get_supabase_client()

        # Read sensor data
        sensor_data = read_sensor_data()

        if not sensor_data:
            logger.warning("No sensor data received")
            return

        # Update database
        update_variables(client, sensor_data)

        logger.info("Data ingestion completed successfully")

    except Exception as e:
        logger.error(f"Data ingestion failed: {e}", exc_info=True)
        raise

if __name__ == '__main__':
    main()
```

### 3.2 Node.js Alternative

Create `data-ingestion.js`:

```javascript
/**
 * Industrial Monitor - Data Ingestion Script (Node.js)
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Read sensor data from your data source
 * Replace with actual sensor/PLC communication
 */
async function readSensorData() {
  // Example: Read from a local API or file
  // const response = await fetch('http://localhost:8080/sensors');
  // return response.json();

  return {
    boiler_temp_1: 95.5,
    boiler_pressure_1: 5.2,
    // ... other variables
  };
}

/**
 * Calculate status based on thresholds
 */
function calculateStatus(value, minThresh, maxThresh) {
  if (value === null || value === undefined) return 'error';
  if (value < minThresh || value > maxThresh) return 'critical';

  const warningMargin = (maxThresh - minThresh) * 0.1;
  if (value < minThresh + warningMargin || value > maxThresh - warningMargin) {
    return 'warning';
  }
  return 'normal';
}

/**
 * Main ingestion function
 */
async function ingestData() {
  console.log(`[${new Date().toISOString()}] Starting data ingestion...`);

  try {
    // Get current variables with thresholds
    const { data: variables, error: fetchError } = await supabase
      .from('variables')
      .select('*');

    if (fetchError) throw fetchError;

    const varMap = Object.fromEntries(variables.map(v => [v.name, v]));

    // Read sensor data
    const sensorData = await readSensorData();

    // Prepare updates
    const updates = [];
    const historyRecords = [];

    for (const [name, value] of Object.entries(sensorData)) {
      const variable = varMap[name];
      if (!variable) {
        console.warn(`Unknown variable: ${name}`);
        continue;
      }

      const status = calculateStatus(value, variable.min_threshold, variable.max_threshold);

      updates.push({ name, value, status });
      historyRecords.push({
        variable_id: variable.id,
        value,
        status
      });
    }

    // Update variables
    for (const update of updates) {
      await supabase
        .from('variables')
        .update({ value: update.value, status: update.status })
        .eq('name', update.name);
    }

    // Insert history
    if (historyRecords.length > 0) {
      await supabase.from('readings_history').insert(historyRecords);
    }

    console.log(`[${new Date().toISOString()}] Updated ${updates.length} variables`);

  } catch (error) {
    console.error('Ingestion failed:', error);
    process.exit(1);
  }
}

ingestData();
```

### 3.3 Scheduling with Cron

Add to crontab (`crontab -e`):

```bash
# Run data ingestion every minute
* * * * * /usr/bin/python3 /opt/industrial-monitor/data_ingestion.py >> /var/log/industrial-monitor/cron.log 2>&1

# Alternative for Node.js
# * * * * * /usr/bin/node /opt/industrial-monitor/data-ingestion.js >> /var/log/industrial-monitor/cron.log 2>&1

# Cleanup old history daily at 2 AM
0 2 * * * /usr/bin/python3 /opt/industrial-monitor/cleanup_history.py >> /var/log/industrial-monitor/cleanup.log 2>&1
```

### 3.4 Systemd Service (Alternative to Cron)

Create `/etc/systemd/system/industrial-monitor-ingestion.service`:

```ini
[Unit]
Description=Industrial Monitor Data Ingestion
After=network.target

[Service]
Type=oneshot
User=industrial-monitor
EnvironmentFile=/etc/industrial-monitor/env
ExecStart=/usr/bin/python3 /opt/industrial-monitor/data_ingestion.py
StandardOutput=journal
StandardError=journal
```

Create `/etc/systemd/system/industrial-monitor-ingestion.timer`:

```ini
[Unit]
Description=Run Industrial Monitor Ingestion Every Minute

[Timer]
OnCalendar=*:*:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable with:
```bash
sudo systemctl enable industrial-monitor-ingestion.timer
sudo systemctl start industrial-monitor-ingestion.timer
```

---

## 4. Frontend Integration

### 4.1 Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 4.2 Supabase Client Configuration

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions
export interface Variable {
  id: number;
  name: string;
  display_name: string;
  value: number | null;
  unit: string;
  category: string;
  min_threshold: number;
  max_threshold: number;
  status: 'normal' | 'warning' | 'critical' | 'error';
  updated_at: string;
}

export interface ReadingHistory {
  id: number;
  variable_id: number;
  value: number;
  status: string;
  recorded_at: string;
}
```

### 4.3 Environment Variables

Create `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** Add `.env.local` to `.gitignore`:
```
.env.local
.env.*.local
```

### 4.4 Data Hook with Real-time Subscriptions

Create `src/hooks/useVariables.ts`:

```typescript
import { useState, useEffect } from 'react';
import { supabase, Variable } from '../lib/supabase';

export function useVariables() {
  const [variables, setVariables] = useState<Variable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Initial fetch
    async function fetchVariables() {
      try {
        const { data, error } = await supabase
          .from('variables')
          .select('*')
          .order('category', { ascending: true });

        if (error) throw error;
        setVariables(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchVariables();

    // Set up real-time subscription
    const subscription = supabase
      .channel('variables-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'variables'
        },
        (payload) => {
          setVariables(current =>
            current.map(v =>
              v.id === payload.new.id ? { ...v, ...payload.new } : v
            )
          );
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { variables, loading, error };
}
```

### 4.5 Hook for Historical Data

Create `src/hooks/useVariableHistory.ts`:

```typescript
import { useState, useEffect } from 'react';
import { supabase, ReadingHistory } from '../lib/supabase';

export function useVariableHistory(variableId: number, hours: number = 24) {
  const [history, setHistory] = useState<ReadingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const startTime = new Date();
        startTime.setHours(startTime.getHours() - hours);

        const { data, error } = await supabase
          .from('readings_history')
          .select('*')
          .eq('variable_id', variableId)
          .gte('recorded_at', startTime.toISOString())
          .order('recorded_at', { ascending: true });

        if (error) throw error;
        setHistory(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [variableId, hours]);

  return { history, loading, error };
}
```

### 4.6 Replace Mock Data in Components

Before (mock data):
```typescript
const mockVariables = [
  { name: 'Boiler Temp', value: 95, unit: '°C' },
  // ...
];
```

After (real data):
```typescript
import { useVariables } from '../hooks/useVariables';

function Dashboard() {
  const { variables, loading, error } = useVariables();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="grid grid-cols-3 gap-4">
      {variables.map(variable => (
        <VariableCard key={variable.id} variable={variable} />
      ))}
    </div>
  );
}
```

### 4.7 Authentication (Optional but Recommended)

For additional security, require user login:

```typescript
// src/lib/auth.ts
import { supabase } from './supabase';

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { user: data.user, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => setUser(session?.user ?? null)
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user };
}
```

---

## 5. Security Best Practices

### 5.1 Environment Variables

**Server-side (data ingestion script):**

Create `/etc/industrial-monitor/env`:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

Secure the file:
```bash
sudo chmod 600 /etc/industrial-monitor/env
sudo chown industrial-monitor:industrial-monitor /etc/industrial-monitor/env
```

**Frontend:**
- Only use the `anon` key, never the service key
- Keys are exposed to clients, but RLS protects the data

### 5.2 Row Level Security Policies

The policies defined in section 2.4 ensure:
- Anonymous users cannot access any data
- Authenticated users can only read data
- Only the service role (data ingestion) can write data

Additional policies for user-specific access:

```sql
-- Allow users to only see variables they have permission for
CREATE POLICY "Users can view assigned variables"
ON variables FOR SELECT
TO authenticated
USING (
  category IN (
    SELECT category FROM user_permissions
    WHERE user_id = auth.uid()
  )
);
```

### 5.3 API Security

1. **Enable SSL/TLS** - Supabase enforces HTTPS by default
2. **Rate Limiting** - Configure in Supabase dashboard
3. **Request Validation** - Supabase validates requests against schema

### 5.4 Network Security

```
┌─────────────────────────────────────────────────────────────┐
│                    Internal Network                          │
│  ┌─────────────┐     ┌──────────────────┐                   │
│  │  Sensors    │────▶│  Ingestion       │                   │
│  │  PLCs       │     │  Server          │                   │
│  └─────────────┘     └────────┬─────────┘                   │
│                               │                              │
└───────────────────────────────┼──────────────────────────────┘
                                │ HTTPS (443)
                                ▼
                    ┌───────────────────────┐
                    │      Supabase         │
                    │   (Cloud/Self-host)   │
                    └───────────┬───────────┘
                                │ HTTPS (443)
                                ▼
                    ┌───────────────────────┐
                    │    React Frontend     │
                    │   (Vercel/Netlify)    │
                    └───────────────────────┘
```

### 5.5 Authentication Flow

```
┌──────────┐     ┌─────────────┐     ┌───────────┐
│  User    │────▶│  Login Form │────▶│ Supabase  │
└──────────┘     └─────────────┘     │   Auth    │
                                     └─────┬─────┘
                                           │
                                     JWT Token
                                           │
                                           ▼
                                   ┌───────────────┐
                                   │   Dashboard   │
                                   │  (Protected)  │
                                   └───────────────┘
```

---

## 6. Alternative Options

### 6.1 Firebase Comparison

| Feature | Supabase | Firebase |
|---------|----------|----------|
| Database | PostgreSQL (relational) | Firestore (NoSQL) |
| Real-time | Yes | Yes |
| Self-hosting | Yes (open source) | No |
| SQL Support | Full SQL | Limited queries |
| Pricing | Generous free tier | Pay per read/write |
| Row Level Security | Native PostgreSQL RLS | Security rules |
| Best for | Relational data, SQL fans | Document data, mobile apps |

**Recommendation:** Supabase is better for industrial data due to:
- Relational data model suits sensor variables
- SQL for complex historical queries
- Self-hosting option for air-gapped environments

### 6.2 Self-Hosted Options

If data cannot leave your network:

**Option A: Self-hosted Supabase**
```bash
# Clone and run with Docker
git clone https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env
docker-compose up -d
```

**Option B: Direct PostgreSQL + Custom API**
- PostgreSQL for storage
- Node.js/Python API with WebSocket for real-time
- More work but full control

**Option C: TimescaleDB (Time-series optimized)**
```sql
-- Optimized for time-series data
CREATE EXTENSION IF NOT EXISTS timescaledb;
SELECT create_hypertable('readings_history', 'recorded_at');
```

### 6.3 Cost Considerations

**Supabase Free Tier Includes:**
- 500 MB database storage
- 2 GB bandwidth
- 50,000 monthly active users
- Unlimited API requests

**For 69 variables at 1-minute intervals:**
- ~100,000 updates/day
- ~3 million updates/month
- Storage: ~1-2 GB/month for history

**Estimated Costs (if exceeding free tier):**
- Supabase Pro: $25/month
- Firebase: ~$50-100/month (based on read/write volume)
- Self-hosted: Server costs only (~$20-50/month VPS)

---

## 7. Implementation Checklist

### Phase 1: Setup
- [ ] Create Supabase project
- [ ] Set up database schema
- [ ] Configure Row Level Security
- [ ] Create test user accounts

### Phase 2: Data Ingestion
- [ ] Install Python/Node.js dependencies
- [ ] Configure sensor/PLC connections
- [ ] Test data reading locally
- [ ] Deploy ingestion script to server
- [ ] Set up cron/systemd scheduling
- [ ] Configure logging and monitoring

### Phase 3: Frontend Integration
- [ ] Install Supabase client library
- [ ] Set up environment variables
- [ ] Create data hooks
- [ ] Replace mock data with real data
- [ ] Test real-time subscriptions
- [ ] Add authentication (if required)

### Phase 4: Testing & Deployment
- [ ] Test end-to-end data flow
- [ ] Verify real-time updates work
- [ ] Load test with 69 variables
- [ ] Deploy frontend to production
- [ ] Monitor for errors
- [ ] Document runbooks

---

## 8. Troubleshooting

### Common Issues

**Real-time subscriptions not working:**
```typescript
// Ensure you're subscribing to the correct channel
const subscription = supabase
  .channel('any-unique-name')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'variables' }, handler)
  .subscribe((status) => {
    console.log('Subscription status:', status);
  });
```

**RLS blocking requests:**
```sql
-- Debug RLS policies
SELECT * FROM pg_policies WHERE tablename = 'variables';

-- Temporarily disable for testing (never in production)
ALTER TABLE variables DISABLE ROW LEVEL SECURITY;
```

**Data not updating:**
- Check cron job is running: `systemctl status industrial-monitor-ingestion.timer`
- Check logs: `journalctl -u industrial-monitor-ingestion`
- Verify environment variables are set correctly

---

## 9. Contact & Support

For questions or issues with this implementation:
- Review Supabase documentation: https://supabase.com/docs
- Check the project README.md for application-specific details
- Consult your IT team for sensor/PLC connectivity questions
