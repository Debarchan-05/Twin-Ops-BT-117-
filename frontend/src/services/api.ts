import {
  Asset,
  Alert,
  MaintenanceRecord,
  SimulationStatus,
  TelemetryReading,
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
    try {
      const data = await res.json();
      if (data.detail) {
        errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      }
    } catch {
      // Keep default message
    }
    throw new Error(errorMsg);
  }
  if (res.status === 204) {
    return {} as T;
  }
  return res.json();
}

// Assets API
export async function getAssets(params?: {
  asset_type?: string;
  operational_status?: string;
  health_condition?: string;
  search?: string;
}): Promise<Asset[]> {
  const query = new URLSearchParams();
  if (params?.asset_type) query.append('asset_type', params.asset_type);
  if (params?.operational_status) query.append('operational_status', params.operational_status);
  if (params?.health_condition) query.append('health_condition', params.health_condition);
  if (params?.search) query.append('search', params.search);

  const res = await fetch(`${API_BASE}/assets?${query.toString()}`);
  return handleResponse<Asset[]>(res);
}

export async function getAsset(id: string): Promise<Asset> {
  const res = await fetch(`${API_BASE}/assets/${encodeURIComponent(id)}`);
  return handleResponse<Asset>(res);
}

export async function createAsset(asset: Partial<Asset>): Promise<Asset> {
  const res = await fetch(`${API_BASE}/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(asset),
  });
  return handleResponse<Asset>(res);
}

export async function updateAsset(id: string, asset: Partial<Asset>): Promise<Asset> {
  const res = await fetch(`${API_BASE}/assets/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(asset),
  });
  return handleResponse<Asset>(res);
}

export async function deleteAsset(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/assets/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return handleResponse<void>(res);
}

// Telemetry API
export async function getAssetTelemetry(
  assetId: string,
  params?: { limit?: number; start_time?: string; end_time?: string }
): Promise<TelemetryReading[]> {
  const query = new URLSearchParams();
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.start_time) query.append('start_time', params.start_time);
  if (params?.end_time) query.append('end_time', params.end_time);

  const res = await fetch(`${API_BASE}/assets/${encodeURIComponent(assetId)}/telemetry?${query.toString()}`);
  return handleResponse<TelemetryReading[]>(res);
}

export async function getAllLatestTelemetry(): Promise<Record<string, TelemetryReading>> {
  const res = await fetch(`${API_BASE}/telemetry/latest`);
  return handleResponse<Record<string, TelemetryReading>>(res);
}

// Alerts API
export async function getAlerts(params?: {
  asset_id?: string;
  severity?: string;
  status?: string;
  limit?: number;
}): Promise<Alert[]> {
  const query = new URLSearchParams();
  if (params?.asset_id) query.append('asset_id', params.asset_id);
  if (params?.severity) query.append('severity', params.severity);
  if (params?.status) query.append('status', params.status);
  if (params?.limit) query.append('limit', params.limit.toString());

  const res = await fetch(`${API_BASE}/alerts?${query.toString()}`);
  return handleResponse<Alert[]>(res);
}

export async function updateAlert(
  id: string,
  data: { status?: string; acknowledged_by?: string; resolution_notes?: string }
): Promise<Alert> {
  const res = await fetch(`${API_BASE}/alerts/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Alert>(res);
}

// Maintenance API
export async function getMaintenanceRecords(params?: {
  asset_id?: string;
  status?: string;
  priority?: string;
}): Promise<MaintenanceRecord[]> {
  const query = new URLSearchParams();
  if (params?.asset_id) query.append('asset_id', params.asset_id);
  if (params?.status) query.append('status', params.status);
  if (params?.priority) query.append('priority', params.priority);

  const res = await fetch(`${API_BASE}/maintenance?${query.toString()}`);
  return handleResponse<MaintenanceRecord[]>(res);
}

export async function createMaintenanceRecord(record: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
  const res = await fetch(`${API_BASE}/maintenance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  return handleResponse<MaintenanceRecord>(res);
}

export async function updateMaintenanceRecord(
  id: string,
  data: Partial<MaintenanceRecord>
): Promise<MaintenanceRecord> {
  const res = await fetch(`${API_BASE}/maintenance/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<MaintenanceRecord>(res);
}

// Simulation API
export async function getSimulationStatus(): Promise<SimulationStatus> {
  const res = await fetch(`${API_BASE}/simulation/status`);
  return handleResponse<SimulationStatus>(res);
}

export async function startSimulation(): Promise<SimulationStatus> {
  const res = await fetch(`${API_BASE}/simulation/start`, { method: 'POST' });
  return handleResponse<SimulationStatus>(res);
}

export async function pauseSimulation(): Promise<SimulationStatus> {
  const res = await fetch(`${API_BASE}/simulation/pause`, { method: 'POST' });
  return handleResponse<SimulationStatus>(res);
}

export async function resumeSimulation(): Promise<SimulationStatus> {
  const res = await fetch(`${API_BASE}/simulation/resume`, { method: 'POST' });
  return handleResponse<SimulationStatus>(res);
}

export async function resetSimulation(seed?: number): Promise<SimulationStatus> {
  const res = await fetch(`${API_BASE}/simulation/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(seed ? { seed } : {}),
  });
  return handleResponse<SimulationStatus>(res);
}

export async function triggerScenario(
  assetId: string,
  scenario: string,
  intensity: number = 1.0
): Promise<SimulationStatus> {
  const res = await fetch(`${API_BASE}/simulation/scenarios/${encodeURIComponent(assetId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario, intensity }),
  });
  return handleResponse<SimulationStatus>(res);
}
