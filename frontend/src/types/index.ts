export type AssetType = 'electric_motor' | 'water_pump' | 'industrial_fan';
export type OperationalStatus = 'running' | 'stopped' | 'offline';
export type HealthCondition = 'healthy' | 'degraded' | 'critical' | 'offline';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'critical';
export type AlertSeverity = 'warning' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';
export type MaintenanceType = 'preventive' | 'corrective' | 'inspection' | 'overhaul';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface SensorDefinition {
  id: number;
  asset_id: string;
  sensor_key: string;
  name: string;
  unit: string;
  min_valid: number;
  max_valid: number;
  warning_threshold: number;
  critical_threshold: number;
  nominal_value: number;
  lower_warning_threshold?: number | null;
  lower_critical_threshold?: number | null;
  weight: number;
}

export interface SensorStatusDetail {
  name: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical' | 'offline';
  nominal: number;
  warning_threshold: number;
  critical_threshold: number;
}

export interface Asset {
  id: string;
  name: string;
  asset_type: AssetType;
  location: string;
  manufacturer?: string | null;
  model_number?: string | null;
  operational_status: OperationalStatus;
  installation_date?: string | null;
  health_score: number;
  health_condition: HealthCondition;
  degradation_indicator: number;
  maintenance_priority: MaintenancePriority;
  recommended_action: string;
  operating_hours: number;
  last_telemetry_timestamp?: string | null;
  created_at: string;
  updated_at: string;
  sensors: SensorDefinition[];
}

export interface TelemetryReading {
  id: number;
  asset_id: string;
  timestamp: string;
  metrics: Record<string, number>;
  calculated_health_score: number;
  is_simulated: boolean;
}

export interface Alert {
  id: string;
  asset_id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  sensor_key: string;
  measured_value: number;
  threshold_value: number;
  timestamp: string;
  status: AlertStatus;
  acknowledged_at?: string | null;
  acknowledged_by?: string | null;
  resolved_at?: string | null;
  resolution_notes?: string | null;
}

export interface MaintenanceRecord {
  id: string;
  asset_id: string;
  maintenance_type: MaintenanceType;
  priority: MaintenancePriority;
  description: string;
  scheduled_date: string;
  completed_date?: string | null;
  status: MaintenanceStatus;
  technician?: string | null;
  notes?: string | null;
  actions_taken?: string | null;
  created_at: string;
}

export interface SimulationStatus {
  is_running: boolean;
  interval_seconds: number;
  seed: number;
  tick_count: number;
  active_scenarios: Record<string, string>;
  total_assets_simulated: number;
}

export interface LiveAssetUpdate {
  asset_id: string;
  name: string;
  operational_status: OperationalStatus;
  metrics: Record<string, number>;
  health_score: number;
  health_condition: HealthCondition;
  degradation_indicator: number;
  maintenance_priority: MaintenancePriority;
  recommended_action: string;
  sensor_statuses: Record<string, SensorStatusDetail>;
  detected_anomalies: string[];
  active_scenario?: string | null;
}

export interface WebSocketTelemetryMessage {
  type: 'telemetry_update';
  timestamp: string;
  tick: number;
  assets: Record<string, LiveAssetUpdate>;
}
