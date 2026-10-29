import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Activity,
  HeartPulse,
  AlertTriangle,
  Flame,
  ArrowRight,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { Asset, Alert, LiveAssetUpdate } from '../types';
import { getAssets, getAlerts } from '../services/api';
import { StatCard } from '../components/StatCard';
import { HealthBadge } from '../components/HealthBadge';
import { StatusBadge } from '../components/StatusBadge';

interface OverviewDashboardProps {
  liveAssets: Record<string, LiveAssetUpdate>;
  onSelectAsset: (assetId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  liveAssets,
  onSelectAsset,
  onNavigateTab,
}) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [fetchedAssets, fetchedAlerts] = await Promise.all([
        getAssets(),
        getAlerts({ limit: 6 }),
      ]);
      setAssets(fetchedAssets);
      setRecentAlerts(fetchedAlerts);
    } catch (err) {
      console.error('Failed to load overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Merge backend asset configurations with real-time live telemetry stream
  const mergedAssets = assets.map((asset) => {
    const live = liveAssets[asset.id];
    if (!live) return asset;
    return {
      ...asset,
      health_score: live.health_score ?? asset.health_score,
      health_condition: live.health_condition ?? asset.health_condition,
      degradation_indicator: live.degradation_indicator ?? asset.degradation_indicator,
      operational_status: live.operational_status ?? asset.operational_status,
      recommended_action: live.recommended_action ?? asset.recommended_action,
      liveMetrics: live.metrics,
      activeScenario: live.active_scenario,
    };
  });

  // Calculate fleet KPI statistics
  const totalAssets = mergedAssets.length;
  const runningCount = mergedAssets.filter((a) => a.operational_status === 'running').length;
  const healthyCount = mergedAssets.filter((a) => a.health_condition === 'healthy').length;
  const degradedCount = mergedAssets.filter((a) => a.health_condition === 'degraded').length;
  const criticalCount = mergedAssets.filter((a) => a.health_condition === 'critical').length;
  const activeAlertsCount = recentAlerts.filter((a) => a.status === 'active').length;

  const averageFleetHealth =
    totalAssets > 0
      ? (mergedAssets.reduce((sum, a) => sum + a.health_score, 0) / totalAssets).toFixed(1)
      : '0';

  if (loading && assets.length === 0) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
        <span className="text-sm font-mono">Synchronizing TwinOps telemetry grid...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Industrial Fleet Overview
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800 text-cyan-300">
              Live Digital Twin
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time operating telemetry, health distribution, and predictive anomaly feed
          </p>
        </div>
      </div>

      {/* KPI Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Fleet Health Index"
          value={`${averageFleetHealth}%`}
          subtitle={`${healthyCount} of ${totalAssets} assets in nominal condition`}
          icon={HeartPulse}
          variant={
            Number(averageFleetHealth) >= 80
              ? 'emerald'
              : Number(averageFleetHealth) >= 50
              ? 'amber'
              : 'rose'
          }
        />
        <StatCard
          title="Active Assets"
          value={`${runningCount} / ${totalAssets}`}
          subtitle="Real-time running machinery"
          icon={Boxes}
          variant="cyan"
        />
        <StatCard
          title="Asset Status Breakdown"
          value={`${healthyCount}H / ${degradedCount}D / ${criticalCount}C`}
          subtitle="Healthy · Degraded · Critical"
          icon={Activity}
          variant={criticalCount > 0 ? 'rose' : degradedCount > 0 ? 'amber' : 'emerald'}
        />
        <StatCard
          title="Active Alerts"
          value={activeAlertsCount}
          subtitle="Anomalies requiring attention"
          icon={AlertTriangle}
          variant={activeAlertsCount > 0 ? 'rose' : 'default'}
        />
      </div>

      {/* Fleet Health Distribution Bar */}
      <div className="p-5 rounded-xl bg-industrial-900 border border-slate-800">
        <div className="flex items-center justify-between mb-3 text-xs font-mono">
          <span className="text-slate-300 uppercase tracking-wider font-semibold">
            Fleet Health Condition Distribution
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              Healthy ({healthyCount})
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              Degraded ({degradedCount})
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              Critical ({criticalCount})
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
          {totalAssets > 0 && (
            <>
              <div
                style={{ width: `${(healthyCount / totalAssets) * 100}%` }}
                className="bg-emerald-500 transition-all duration-500 hover:opacity-90"
                title={`Healthy: ${healthyCount}`}
              />
              <div
                style={{ width: `${(degradedCount / totalAssets) * 100}%` }}
                className="bg-amber-500 transition-all duration-500 hover:opacity-90"
                title={`Degraded: ${degradedCount}`}
              />
              <div
                style={{ width: `${(criticalCount / totalAssets) * 100}%` }}
                className="bg-rose-500 transition-all duration-500 hover:opacity-90 animate-pulse"
                title={`Critical: ${criticalCount}`}
              />
            </>
          )}
        </div>
      </div>

      {/* Industrial Asset Virtual Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Monitored Infrastructure Digital Twins
          </h3>
          <button
            onClick={() => onNavigateTab('assets')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
          >
            Explore all assets <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {mergedAssets.map((asset: any) => {
            const metrics = asset.liveMetrics || {};
            return (
              <div
                key={asset.id}
                onClick={() => onSelectAsset(asset.id)}
                className="group cursor-pointer rounded-2xl bg-industrial-900 border border-slate-800 hover:border-cyan-500/50 p-5 transition-all duration-200 shadow-xl hover:shadow-cyan-500/10 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        {asset.asset_type.replace('_', ' ')} · {asset.id}
                      </span>
                      <h4 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                        {asset.name}
                      </h4>
                      <p className="text-xs text-slate-400 truncate">{asset.location}</p>
                    </div>
                    <HealthBadge condition={asset.health_condition} score={asset.health_score} />
                  </div>

                  {/* Active Scenario Ribbon if any */}
                  {asset.activeScenario && (
                    <div className="mb-3 px-2.5 py-1 rounded-md bg-rose-950/70 border border-rose-500/50 text-rose-300 text-[11px] font-mono flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                      <span>Fault Active: {asset.activeScenario}</span>
                    </div>
                  )}

                  {/* Quick telemetry readings preview */}
                  <div className="grid grid-cols-2 gap-2 my-4 p-3 rounded-xl bg-industrial-950/80 border border-slate-800/80">
                    {asset.sensors.slice(0, 4).map((sensor: any) => {
                      const val = metrics[sensor.sensor_key] ?? sensor.nominal_value;
                      return (
                        <div key={sensor.sensor_key} className="flex flex-col">
                          <span className="text-[10px] text-slate-400 truncate">
                            {sensor.name}
                          </span>
                          <span className="text-sm font-bold font-mono text-slate-200">
                            {typeof val === 'number' ? val.toFixed(1) : val}{' '}
                            <span className="text-[10px] font-normal text-slate-400">
                              {sensor.unit}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <StatusBadge status={asset.operational_status} size="sm" />
                  <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Inspect Twin <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Alerts Feed */}
      <div className="rounded-2xl bg-industrial-900 border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold text-slate-100">Live Anomaly Feed</h3>
          </div>
          <button
            onClick={() => onNavigateTab('alerts')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
          >
            View all alerts <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentAlerts.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            No active or recent anomalies detected across the fleet.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                      alert.severity === 'critical'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-slate-200">
                      {alert.title}
                      <span className="text-xs font-mono text-slate-400 ml-2">
                        ({alert.asset_id})
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{alert.description}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-400 sm:text-right">
                  <div>
                    <span className="block text-slate-300 font-semibold">
                      {alert.measured_value.toFixed(1)} / {alert.threshold_value.toFixed(1)}
                    </span>
                    <span className="text-[10px] opacity-70">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] ${
                      alert.status === 'active'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : alert.status === 'acknowledged'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {alert.status}
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
