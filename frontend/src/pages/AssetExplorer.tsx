import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { Asset, LiveAssetUpdate } from '../types';
import { getAssets, createAsset, updateAsset, deleteAsset } from '../services/api';
import { HealthBadge } from '../components/HealthBadge';
import { StatusBadge } from '../components/StatusBadge';
import { AssetModal } from '../components/AssetModal';

interface AssetExplorerProps {
  liveAssets: Record<string, LiveAssetUpdate>;
  onSelectAsset: (assetId: string) => void;
}

export const AssetExplorer: React.FC<AssetExplorerProps> = ({
  liveAssets,
  onSelectAsset,
}) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [healthFilter, setHealthFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const fetchAssetsList = async () => {
    try {
      setLoading(true);
      const data = await getAssets({
        search: search || undefined,
        asset_type: typeFilter || undefined,
        operational_status: statusFilter || undefined,
        health_condition: healthFilter || undefined,
      });
      setAssets(data);
    } catch (err) {
      console.error('Failed to fetch assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssetsList();
  }, [typeFilter, statusFilter, healthFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAssetsList();
  };

  const handleCreateOrUpdate = async (data: Partial<Asset>) => {
    if (editingAsset) {
      await updateAsset(editingAsset.id, data);
    } else {
      await createAsset(data);
    }
    await fetchAssetsList();
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to decommission and remove asset "${name}"?`)) {
      try {
        await deleteAsset(id);
        await fetchAssetsList();
      } catch (err) {
        alert('Failed to delete asset: ' + err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Asset Explorer & Virtual Twins
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse, inspect, configure, and provision industrial infrastructure twins
          </p>
        </div>
        <button
          onClick={() => {
            setEditingAsset(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold shadow-lg shadow-cyan-600/30 transition-colors"
        >
          <Plus className="w-4 h-4" /> Provision Asset
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-industrial-900 border border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, asset ID, or plant section..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-industrial-950 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-industrial-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Asset Types</option>
            <option value="electric_motor">Electric Motor</option>
            <option value="water_pump">Water Pump</option>
            <option value="industrial_fan">Industrial Fan</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-industrial-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Statuses</option>
            <option value="running">Running</option>
            <option value="stopped">Stopped</option>
            <option value="offline">Offline</option>
          </select>

          <select
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-industrial-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Health Conditions</option>
            <option value="healthy">Healthy (80-100%)</option>
            <option value="degraded">Degraded (50-79%)</option>
            <option value="critical">Critical (&lt;50%)</option>
          </select>

          <button
            onClick={fetchAssetsList}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Asset Table / Grid */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
          <span className="text-sm font-mono">Loading assets...</span>
        </div>
      ) : assets.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center rounded-2xl bg-industrial-900 border border-slate-800 text-slate-400">
          <Cpu className="w-10 h-10 mb-2 opacity-50 text-cyan-400" />
          <p className="text-sm">No industrial assets found matching criteria</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-industrial-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-industrial-950/60 font-mono text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Asset ID / Name</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Health Score</th>
                  <th className="py-3.5 px-4">Degradation</th>
                  <th className="py-3.5 px-4">Sensors</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {assets.map((asset) => {
                  const live = liveAssets[asset.id];
                  const healthScore = live?.health_score ?? asset.health_score;
                  const healthCondition = live?.health_condition ?? asset.health_condition;
                  const degradation = live?.degradation_indicator ?? asset.degradation_indicator;
                  const opStatus = live?.operational_status ?? asset.operational_status;

                  return (
                    <tr
                      key={asset.id}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => onSelectAsset(asset.id)}
                    >
                      <td className="py-4 px-4">
                        <div className="font-semibold text-sm text-slate-100 hover:text-cyan-400">
                          {asset.name}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400">{asset.id}</div>
                      </td>
                      <td className="py-4 px-4 capitalize font-mono text-slate-300">
                        {asset.asset_type.replace('_', ' ')}
                      </td>
                      <td className="py-4 px-4 text-slate-300">{asset.location}</td>
                      <td className="py-4 px-4">
                        <StatusBadge status={opStatus} size="sm" />
                      </td>
                      <td className="py-4 px-4">
                        <HealthBadge condition={healthCondition} score={healthScore} size="sm" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
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
                          <span className="font-mono text-[11px] text-slate-400">
                            {degradation.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                          {asset.sensors.length} probes
                        </span>
                      </td>
                      <td
                        className="py-4 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSelectAsset(asset.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400"
                            title="Open Digital Twin"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingAsset(asset);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                            title="Edit Configuration"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(asset.id, asset.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400"
                            title="Decommission Asset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Provision / Edit Modal */}
      <AssetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={editingAsset}
      />
    </div>
  );
};
