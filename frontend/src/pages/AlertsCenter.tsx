import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { Alert, Asset } from '../types';
import { getAlerts, updateAlert, getAssets } from '../services/api';

export const AlertsCenter: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Resolution modal / prompt state
  const [resolvingAlertId, setResolvingAlertId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');

  const fetchAlertsList = async () => {
    try {
      setLoading(true);
      const [fetchedAlerts, fetchedAssets] = await Promise.all([
        getAlerts({
          asset_id: selectedAsset || undefined,
          severity: selectedSeverity || undefined,
          status: selectedStatus || undefined,
          limit: 100,
        }),
        getAssets(),
      ]);
      setAlerts(fetchedAlerts);
      setAssets(fetchedAssets);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsList();
    const interval = setInterval(fetchAlertsList, 4000);
    return () => clearInterval(interval);
  }, [selectedAsset, selectedSeverity, selectedStatus]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      await updateAlert(alertId, {
        status: 'acknowledged',
        acknowledged_by: 'Control Room Engineer',
      });
      await fetchAlertsList();
    } catch (err) {
      alert('Failed to acknowledge alert: ' + err);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingAlertId) return;

    try {
      await updateAlert(resolvingAlertId, {
        status: 'resolved',
        resolution_notes: resolutionNotes || 'Issue addressed and telemetry normalized.',
      });
      setResolvingAlertId(null);
      setResolutionNotes('');
      await fetchAlertsList();
    } catch (err) {
      alert('Failed to resolve alert: ' + err);
    }
  };

  const activeCount = alerts.filter((a) => a.status === 'active').length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical' && a.status !== 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Industrial Alerts & Anomaly Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time threshold violations, hysteresis tracking, and alarm lifecycle management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono font-medium flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            {criticalCount} Critical Unresolved
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-mono font-medium">
            {activeCount} Active Alarms
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-industrial-900 border border-slate-800 flex flex-wrap items-center gap-3">
        <select
          value={selectedAsset}
          onChange={(e) => setSelectedAsset(e.target.value)}
          className="px-3 py-2 rounded-lg bg-industrial-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Assets</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.id})
            </option>
          ))}
        </select>

        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="px-3 py-2 rounded-lg bg-industrial-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 rounded-lg bg-industrial-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </select>

        <button
          onClick={fetchAlertsList}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white ml-auto"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Alerts Table */}
      {loading && alerts.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
          <span className="text-sm font-mono">Loading alerts...</span>
        </div>
      ) : alerts.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center rounded-2xl bg-industrial-900 border border-slate-800 text-slate-400">
          <CheckCircle className="w-10 h-10 mb-2 opacity-50 text-emerald-400" />
          <p className="text-sm">No alarms matching the selected filters.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-industrial-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-industrial-950/60 font-mono text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4">Asset ID</th>
                  <th className="py-3.5 px-4">Alarm Description</th>
                  <th className="py-3.5 px-4">Measured vs Limit</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase ${
                          alert.severity === 'critical'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono font-semibold text-slate-200">
                      {alert.asset_id}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-200">{alert.title}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{alert.description}</div>
                      {alert.resolution_notes && (
                        <div className="text-emerald-400 text-[11px] mt-1 font-mono">
                          Resolved: {alert.resolution_notes}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono">
                      <span className="font-bold text-slate-100">{alert.measured_value.toFixed(2)}</span>
                      <span className="text-slate-500"> / </span>
                      <span className="text-slate-400">{alert.threshold_value.toFixed(2)}</span>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-400 text-[11px]">
                      {new Date(alert.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                          alert.status === 'active'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : alert.status === 'acknowledged'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {alert.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {alert.status === 'active' && (
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[11px] font-medium"
                          >
                            Acknowledge
                          </button>
                        )}
                        {alert.status !== 'resolved' && (
                          <button
                            onClick={() => {
                              setResolvingAlertId(alert.id);
                              setResolutionNotes('');
                            }}
                            className="px-2.5 py-1 rounded bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[11px] font-medium"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resolve Alert Modal */}
      {resolvingAlertId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-industrial-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Resolve Industrial Alert</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter operational resolution notes to verify corrective actions taken.
            </p>
            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Corrective Actions Performed
                </label>
                <textarea
                  rows={3}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Cleared impeller debris obstruction; bearing temperature normalized to 48°C."
                  className="w-full px-3 py-2 rounded-lg bg-industrial-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolvingAlertId(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
