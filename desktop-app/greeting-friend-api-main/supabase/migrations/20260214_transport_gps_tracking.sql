-- Transport GPS Tracking
-- Adds coordinate columns to transports and creates transport_tracking table

-- 1. Add GPS coordinate columns to transports (if not exist)
ALTER TABLE transports ADD COLUMN IF NOT EXISTS pickup_coords jsonb DEFAULT NULL;
ALTER TABLE transports ADD COLUMN IF NOT EXISTS dropoff_coords jsonb DEFAULT NULL;

COMMENT ON COLUMN transports.pickup_coords IS 'GPS coordinates [lat, lng] for pickup location';
COMMENT ON COLUMN transports.dropoff_coords IS 'GPS coordinates [lat, lng] for dropoff location';

-- 2. Transport tracking table for live GPS positions
CREATE TABLE IF NOT EXISTS transport_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  transport_id uuid NOT NULL REFERENCES transports(id) ON DELETE CASCADE,
  driver_id bigint REFERENCES staff_drivers(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  
  -- Current position
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  accuracy double precision,          -- GPS accuracy in meters
  speed double precision,             -- Speed in km/h
  heading double precision,           -- Bearing in degrees (0-360)
  altitude double precision,          -- Altitude in meters
  
  -- Status
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  event_type text DEFAULT 'position' CHECK (event_type IN ('position', 'start', 'stop', 'pause', 'resume', 'waypoint', 'geofence_enter', 'geofence_exit')),
  
  -- Metadata
  source text DEFAULT 'desktop' CHECK (source IN ('desktop', 'mobile', 'gps_device', 'manual')),
  battery_level integer,              -- Device battery % (mobile)
  metadata jsonb DEFAULT '{}'::jsonb, -- Extra data (device info, etc.)
  
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transport_tracking_transport ON transport_tracking(transport_id);
CREATE INDEX IF NOT EXISTS idx_transport_tracking_org ON transport_tracking(org_id);
CREATE INDEX IF NOT EXISTS idx_transport_tracking_driver ON transport_tracking(driver_id);
CREATE INDEX IF NOT EXISTS idx_transport_tracking_recorded ON transport_tracking(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_transport_tracking_status ON transport_tracking(status) WHERE status = 'active';

-- 3. Transport routes table (stores completed route polylines)
CREATE TABLE IF NOT EXISTS transport_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  transport_id uuid NOT NULL REFERENCES transports(id) ON DELETE CASCADE,
  
  -- Route data
  route_geojson jsonb,                -- Full GeoJSON LineString of the route
  waypoints jsonb DEFAULT '[]'::jsonb,-- Array of {lat, lng, timestamp, label}
  
  -- Stats
  distance_km double precision,       -- Total distance in km
  duration_minutes integer,           -- Total duration in minutes
  avg_speed_kmh double precision,     -- Average speed
  max_speed_kmh double precision,     -- Max speed recorded
  
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transport_routes_transport ON transport_routes(transport_id);
CREATE INDEX IF NOT EXISTS idx_transport_routes_org ON transport_routes(org_id);

-- 4. RLS policies
ALTER TABLE transport_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_routes ENABLE ROW LEVEL SECURITY;

-- transport_tracking policies
CREATE POLICY "transport_tracking_select" ON transport_tracking
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "transport_tracking_insert" ON transport_tracking
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "transport_tracking_delete" ON transport_tracking
  FOR DELETE TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

-- transport_routes policies
CREATE POLICY "transport_routes_select" ON transport_routes
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "transport_routes_insert" ON transport_routes
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "transport_routes_update" ON transport_routes
  FOR UPDATE TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "transport_routes_delete" ON transport_routes
  FOR DELETE TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

-- 5. GPS Devices table (configured trackers)
CREATE TABLE IF NOT EXISTS gps_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  device_type text NOT NULL DEFAULT 'mobile_app' CHECK (device_type IN ('teltonika', 'queclink', 'concox', 'obd2', 'mobile_app', 'api')),
  protocol text NOT NULL DEFAULT 'mobile' CHECK (protocol IN ('tcp', 'http', 'mqtt', 'mobile')),
  device_imei text,                     -- IMEI or unique device identifier
  sim_number text,                      -- SIM card number (hardware trackers)
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id bigint REFERENCES staff_drivers(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz,             -- Last GPS ping received
  last_latitude double precision,
  last_longitude double precision,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gps_devices_org ON gps_devices(org_id);
CREATE INDEX IF NOT EXISTS idx_gps_devices_vehicle ON gps_devices(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_gps_devices_driver ON gps_devices(driver_id);
CREATE INDEX IF NOT EXISTS idx_gps_devices_imei ON gps_devices(device_imei) WHERE device_imei IS NOT NULL;

ALTER TABLE gps_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gps_devices_select" ON gps_devices
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "gps_devices_insert" ON gps_devices
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "gps_devices_update" ON gps_devices
  FOR UPDATE TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "gps_devices_delete" ON gps_devices
  FOR DELETE TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));
