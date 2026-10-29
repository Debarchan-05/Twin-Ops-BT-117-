import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { MaintenanceRecord, Asset } from '../types';
import {
  getMaintenanceRecords,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  getAssets,
} from '../services/api';
import { MaintenanceModal } from '../components/MaintenanceModal';

export const MaintenanceManager: React.FC = () => {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assetFilter, setAssetFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'complete'>('create');
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const [fetchedRecords, fetchedAssets] = await Promise.all([
        getMaintenanceRecords({
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          asset_id: assetFilter || undefined,
        }),
        getAssets(),
      ]);
      setRecords(fetchedRecords);
      setAssets(fetchedAssets);
    } catch (err) {
      console.error('Failed to load maintenance records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [statusFilter, priorityFilter, assetFilter]);

  const handleModalSubmit = async (data: Partial<MaintenanceRecord>) => {
    if (modalMode === 'complete' && selectedRecord) {
      await updateMaintenanceRecord(selectedRecord.id, data);
    } else {
      await createMaintenanceRecord(data);
    }
    await fetchRecords();
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      case 'high':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'medium':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Asset Maintenance & Servicing
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Predictive work order scheduling, repair history, and technician action logs
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedRecord(null);
            setModalMode('create');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold shadow-lg shadow-cyan-600/30 transition-colors"
        >
          <Plus className="w-4 h-4" /> Schedule Maintenance
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-industrial-900 border border-slate-800 flex flex-wrap items-center gap-3">
        <select
          value={assetFilter}
          onChange={(e) => setAssetFilter(e.target.value)}
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-industrial-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-industrial-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <button
          onClick={fetchRecords}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white ml-auto"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Records Table */}
      {loading && records.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
          <span className="text-sm font-mono">Loading maintenance records...</span>
        </div>
      ) : records.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center rounded-2xl bg-industrial-900 border border-slate-800 text-slate-400">
          <Wrench className="w-10 h-10 mb-2 opacity-50 text-cyan-400" />
          <p className="text-sm">No maintenance work orders found.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-industrial-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-industrial-950/60 font-mono text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Priority / Type</th>
                  <th className="py-3.5 px-4">Target Asset</th>
                  <th className="py-3.5 px-4">Task Description</th>
                  <th className="py-3.5 px-4">Scheduled Date</th>
                  <th className="py-3.5 px-4">Technician</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getPriorityBadge(
                            rec.priority
                          )}`}
                        >
                          {rec.priority}
                        </span>
                        <span className="text-[11px] font-mono uppercase text-slate-400">
                          {rec.maintenance_type}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono font-semibold text-slate-200">
                      {rec.asset_id}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-100">{rec.description}</div>
                      {rec.actions_taken && (
                        <div className="text-emerald-400 text-[11px] mt-1 font-mono">
                          Completed: {rec.actions_taken}
                        </div>
                      )}
                      {rec.notes && !rec.actions_taken && (
                        <div className="text-slate-400 text-[11px] mt-0.5">{rec.notes}</div>
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-300">
                      {new Date(rec.scheduled_date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      {rec.technician || <span className="text-slate-500 italic">Unassigned</span>}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium uppercase font-mono ${
                          rec.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : rec.status === 'in_progress'
                            ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {rec.status !== 'completed' && (
                        <button
                          onClick={() => {
                            setSelectedRecord(rec);
                            setModalMode('complete');
                            setIsModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[11px] font-medium"
                        >
                          Mark Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      <MaintenanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        assets={assets}
        initialRecord={selectedRecord}
        mode={modalMode}
      />
    </div>
  );
};
