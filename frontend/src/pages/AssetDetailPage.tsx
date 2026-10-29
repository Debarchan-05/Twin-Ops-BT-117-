import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Activity,
  Wrench,
  Gauge,
  Layers,
  Flame,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  Asset,
  TelemetryReading,
  MaintenanceRecord,
  LiveAssetUpdate,
} from '../types';
import {
  getAsset,
  getAssetTelemetry,
  getMaintenanceRecords,
} from '../services/api';
import { HealthBadge } from '../components/HealthBadge';
import { StatusBadge } from '../components/StatusBadge';
import { AssetSchematic } from '../components/AssetSchematic';
import { TelemetryChart } from '../components/TelemetryChart';

interface AssetDetailPageProps {
  assetId: string;
  liveAssets: Record<string, LiveAssetUpdate>;
  onBack: () => void;
  onNavigateTab: (tab: string) => void;
}

export const AssetDetailPage: React.FC<AssetDetailPageProps> = ({
  assetId,
  liveAssets,
  onBack,
  onNavigateTab,
}) => {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryReading[]>([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Time range selection: '30s', '2m', '10m', 'all'
  const [timeRange, setTimeRange] = useState<number>(50); // limit number of samples
  const [activeChartMetric, setActiveChartMetric] = useState<string>('temperature');

  const loadAssetData = async () => {
    try {
      const [fetchedAsset, fetchedTelem, fetchedMaint] = await Promise.all([
        getAsset(assetId),
        getAssetTelemetry(assetId, { limit: timeRange }),
        getMaintenanceRecords({ asset_id: assetId }),
      ]);
      setAsset(fetchedAsset);
      setTelemetryHistory(fetchedTelem);
      setMaintenanceHistory(fetchedMaint);
    } catch (err) {
      console.error('Error fetching asset detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssetData();
    const interval = setInterval(async () => {
      // Poll new telemetry points for chart history
      try {
        const freshTelem = await getAssetTelemetry(assetId, { limit: timeRange });
        setTelemetryHistory(freshTelem);
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [assetId, timeRange]);

  if (loading || !asset) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
        <span className="text-sm font-mono">Loading digital twin parameters for {assetId}...</span>
      </div>
    );
  }

  // Live real-time updates from WebSocket/Polling stream
  const live = liveAssets[assetId];
  const healthScore = live?.health_score ?? asset.health_score;
  const healthCondition = live?.health_condition ?? asset.health_condition;
  const degradation = live?.degradation_indicator ?? asset.degradation_indicator;
  const operationalStatus = live?.operational_status ?? asset.operational_status;
  const recommendedAction = live?.recommended_action ?? asset.recommended_action;
  const metrics = live?.metrics ?? {};
  const activeScenario = live?.active_scenario;

  const activeSensorDef = asset.sensors.find((s) => s.sensor_key === activeChartMetric);

  return (
    <div className="space-y-6">
      {/* Top Navigation & Asset Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-industrial-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-slate-400">{asset.id}</span>
              <span className="text-xs text-slate-600">/</span>
              <span className="text-xs font-mono capitalize text-cyan-400">
                {asset.asset_type.replace('_', ' ')}
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              {asset.name}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={operationalStatus} />
          <HealthBadge condition={healthCondition} score={healthScore} size="lg" />
        </div>
      </div>

      {/* Fault Scenario Banner if active */}
      {activeScenario && (
        <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-500/50 flex items-center justify-between">
          <div className="flex items-center gap-3 text-rose-300">
            <Flame className="w-5 h-5 text-rose-400 animate-bounce" />
            <div>
              <div className="text-sm font-semibold">
                Active Simulation Fault Injected: {activeScenario.toUpperCase()}
              </div>
              <div className="text-xs opacity-80">
                Sensor readings and health score are responding dynamically to injected stress conditions.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('simulation')}
            className="px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-white text-xs font-medium"
          >
            Manage Simulation
          </button>
        </div>
      )}

      {/* Grid: Virtual Twin Schematic & Diagnostic Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AssetSchematic
            assetType={asset.asset_type}
            operationalStatus={operationalStatus}
            healthCondition={healthCondition}
            metrics={metrics}
            sensorStatuses={live?.sensor_statuses}
          />
        </div>

        {/* Explainable Diagnostics & Identity Card */}
        <div className="flex flex-col gap-4">
          {/* Diagnostic Recommendation */}
          <div className="p-5 rounded-2xl bg-industrial-900 border border-slate-800 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Diagnostic Health Assessment
              </div>
              <div className="p-3.5 rounded-xl bg-industrial-950 border border-slate-800 mb-4">
                <div className="text-xs font-mono uppercase text-slate-400 mb-1">
                  Maintenance Recommendation:
                </div>
                <div className="text-sm font-medium text-slate-200">
                  {recommendedAction}
                </div>
              </div>

              {/* Degradation Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Progressive Wear Index:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {degradation.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${degradation}%` }}
                    className={`h-full ${
                      degradation > 60
                        ? 'bg-rose-500'
                        : degradation > 30
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-2">
              <div className="flex justify-between">
                <span>Operating Runtime:</span>
                <span className="font-mono text-slate-200">
                  {asset.operating_hours.toFixed(1)} hrs
                </span>
              </div>
              <div className="flex justify-between">
                <span>Plant Location:</span>
                <span className="text-slate-200">{asset.location}</span>
              </div>
              <div className="flex justify-between">
                <span>Manufacturer:</span>
                <span className="text-slate-200">{asset.manufacturer || 'Standard OEM'}</span>
              </div>
              <div className="flex justify-between">
                <span>Model Designation:</span>
                <span className="font-mono text-slate-200">{asset.model_number || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sensor Registry & Thresholds Table */}
      <div className="p-6 rounded-2xl bg-industrial-900 border border-slate-800">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2 mb-4">
          <Gauge className="w-4 h-4 text-cyan-400" />
          Sensor Registry & Threshold Envelope
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono">
                <th className="py-2.5 px-3">Sensor Parameter</th>
                <th className="py-2.5 px-3">Current Telemetry</th>
                <th className="py-2.5 px-3">Nominal Base</th>
                <th className="py-2.5 px-3">Warning Limit</th>
                <th className="py-2.5 px-3">Critical Limit</th>
                <th className="py-2.5 px-3">Valid Range</th>
                <th className="py-2.5 px-3 text-right">Chart Metric</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {asset.sensors.map((sensor) => {
                const curVal = metrics[sensor.sensor_key] ?? sensor.nominal_value;
                const isSelected = activeChartMetric === sensor.sensor_key;
                return (
                  <tr key={sensor.sensor_key} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-medium text-slate-200 font-sans">
                      {sensor.name}
                    </td>
                    <td className="py-3 px-3 font-bold text-sm text-cyan-400">
                      {typeof curVal === 'number' ? curVal.toFixed(2) : curVal} {sensor.unit}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {sensor.nominal_value} {sensor.unit}
                    </td>
                    <td className="py-3 px-3 text-amber-400 font-medium">
                      {sensor.warning_threshold} {sensor.unit}
                    </td>
                    <td className="py-3 px-3 text-rose-400 font-medium">
                      {sensor.critical_threshold} {sensor.unit}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      [{sensor.min_valid} .. {sensor.max_valid}]
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setActiveChartMetric(sensor.sensor_key)}
                        className={`px-2.5 py-1 rounded text-[11px] font-sans font-medium transition-colors ${
                          isSelected
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {isSelected ? 'Viewing' : 'Select'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Telemetry & Health Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metric Chart */}
        <div className="p-6 rounded-2xl bg-industrial-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                {activeSensorDef?.name || 'Telemetry Trend'}
              </h3>
              <p className="text-xs text-slate-400">Historical sensor samples with threshold markers</p>
            </div>
            <div className="flex items-center gap-1.5 bg-industrial-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
              {[20, 50, 100].map((count) => (
                <button
                  key={count}
                  onClick={() => setTimeRange(count)}
                  className={`px-2 py-0.5 rounded ${
                    timeRange === count ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {count}pts
                </button>
              ))}
            </div>
          </div>

          <TelemetryChart
            data={telemetryHistory}
            metricKey={activeChartMetric}
            metricLabel={activeSensorDef?.name || activeChartMetric}
            unit={activeSensorDef?.unit || ''}
            strokeColor="#06b6d4"
            sensor={activeSensorDef}
            showThresholds={true}
          />
        </div>

        {/* Health Score History Chart */}
        <div className="p-6 rounded-2xl bg-industrial-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Calculated Health Score History
              </h3>
              <p className="text-xs text-slate-400">Dynamic score variations (0 - 100%)</p>
            </div>
          </div>

          <TelemetryChart
            data={telemetryHistory}
            metricKey="health_score"
            metricLabel="Health Score"
            unit="%"
            strokeColor="#10b981"
            showThresholds={false}
          />
        </div>
      </div>

      {/* Asset Maintenance History */}
      <div className="p-6 rounded-2xl bg-industrial-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-cyan-400" />
            Asset Maintenance History & Work Orders
          </h3>
          <button
            onClick={() => onNavigateTab('maintenance')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
          >
            Manage all maintenance &rarr;
          </button>
        </div>

        {maintenanceHistory.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">No maintenance records logged for this asset.</p>
        ) : (
          <div className="divide-y divide-slate-800 text-xs">
            {maintenanceHistory.map((rec) => (
              <div key={rec.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-200">
                    {rec.description}
                    <span className="ml-2 font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {rec.maintenance_type}
                    </span>
                  </div>
                  {rec.actions_taken && (
                    <div className="text-slate-400 mt-1 text-[11px]">
                      <span className="text-slate-500">Actions:</span> {rec.actions_taken}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                  <span>{new Date(rec.scheduled_date).toLocaleDateString()}</span>
                  <span
                    className={`px-2 py-0.5 rounded uppercase ${
                      rec.status === 'completed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {rec.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
