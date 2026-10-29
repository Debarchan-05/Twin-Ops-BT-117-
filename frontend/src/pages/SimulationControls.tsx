import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Flame,
  Activity,
  Zap,
  AlertOctagon,
  TrendingDown,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { Asset, SimulationStatus, LiveAssetUpdate } from '../types';
import {
  getAssets,
  getSimulationStatus,
  pauseSimulation,
  resumeSimulation,
  resetSimulation,
  triggerScenario,
} from '../services/api';
import { HealthBadge } from '../components/HealthBadge';

interface SimulationControlsProps {
  liveAssets: Record<string, LiveAssetUpdate>;
  onSelectAsset?: (assetId: string) => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  liveAssets,
}) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [status, setStatus] = useState<SimulationStatus | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [intensity, setIntensity] = useState<number>(1.2);
  const [customSeed] = useState<number>(42);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const loadData = async () => {
    try {
      const [fetchedAssets, fetchedStatus] = await Promise.all([
        getAssets(),
        getSimulationStatus(),
      ]);
      setAssets(fetchedAssets);
      setStatus(fetchedStatus);
      if (!selectedAssetId && fetchedAssets.length > 0) {
        setSelectedAssetId(fetchedAssets[0].id);
      }
    } catch (err) {
      console.error('Failed to load simulation status:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(async () => {
      try {
        const freshStatus = await getSimulationStatus();
        setStatus(freshStatus);
      } catch {}
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSimulation = async () => {
    try {
      setActionLoading(true);
      if (status?.is_running) {
        const updated = await pauseSimulation();
        setStatus(updated);
        setFeedbackMsg({ type: 'success', text: 'Simulation paused successfully.' });
      } else {
        const updated = await resumeSimulation();
        setStatus(updated);
        setFeedbackMsg({ type: 'success', text: 'Simulation resumed and actively ticking.' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setActionLoading(true);
      const updated = await resetSimulation(customSeed);
      setStatus(updated);
      setFeedbackMsg({
        type: 'success',
        text: `Simulation state reset with reproducible seed ${customSeed}.`,
      });
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleInjectScenario = async (scenario: string) => {
    if (!selectedAssetId) return;
    try {
      setActionLoading(true);
      const updated = await triggerScenario(selectedAssetId, scenario, intensity);
      setStatus(updated);
      setFeedbackMsg({
        type: 'success',
        text: `Scenario "${scenario}" injected for asset ${selectedAssetId} at intensity ${intensity}x.`,
      });
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const scenarios = [
    {
      id: 'overheating',
      name: 'Thermal Overload / Overheating',
      icon: Flame,
      color: 'border-rose-500/40 hover:border-rose-500 bg-rose-950/20 text-rose-300',
      description: 'Drives stator and bearing temperatures above critical threshold (>88°C).',
    },
    {
      id: 'excessive_vibration',
      name: 'Severe Harmonic Vibration',
      icon: Activity,
      color: 'border-amber-500/40 hover:border-amber-500 bg-amber-950/20 text-amber-300',
      description: 'Simulates mechanical unbalance and bearing race spalling (>7.0 mm/s RMS).',
    },
    {
      id: 'abnormal_current',
      name: 'Phase Electrical Overcurrent',
      icon: Zap,
      color: 'border-blue-500/40 hover:border-blue-500 bg-blue-950/20 text-blue-300',
      description: 'Surges electrical current draw, simulating mechanical binding and drag.',
    },
    {
      id: 'sensor_failure',
      name: 'Hardware Sensor Malfunction',
      icon: AlertOctagon,
      color: 'border-purple-500/40 hover:border-purple-500 bg-purple-950/20 text-purple-300',
      description: 'Injects erratic out-of-range impossible readings (-99°C / 999°C).',
    },
    {
      id: 'wear_acceleration',
      name: 'Accelerate Progressive Wear',
      icon: TrendingDown,
      color: 'border-yellow-500/40 hover:border-yellow-500 bg-yellow-950/20 text-yellow-300',
      description: 'Rapidly compounds progressive mechanical wear degradation indicator.',
    },
    {
      id: 'clear',
      name: 'Clear Faults / Restore Nominal',
      icon: CheckCircle2,
      color: 'border-emerald-500/40 hover:border-emerald-500 bg-emerald-950/20 text-emerald-300',
      description: 'Deactivates injected faults and smoothly restores mean-reverting nominal state.',
    },
  ];

  const liveForSelected = liveAssets[selectedAssetId];
  const activeScenarioOnSelected =
    status?.active_scenarios?.[selectedAssetId] || liveForSelected?.active_scenario;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Simulation Control Panel & Fault Injection
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time physics engine, deterministic testing seeds, and stress fault scenarios
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleSimulation}
            disabled={actionLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              status?.is_running
                ? 'bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-900/60'
                : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
            }`}
          >
            {status?.is_running ? (
              <>
                <Pause className="w-4 h-4" /> Pause Simulation Engine
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Resume Simulation Engine
              </>
            )}
          </button>
          <button
            onClick={handleReset}
            disabled={actionLoading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset State
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-white text-xs ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {/* Engine Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-industrial-900 border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-400">Simulation Status</span>
          <div className="text-xl font-bold font-mono mt-1 flex items-center gap-2">
            {status?.is_running ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400">RUNNING</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-amber-400">PAUSED</span>
              </>
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-industrial-900 border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-400">Sampling Interval</span>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
            {status?.interval_seconds ?? 2.0}s
          </div>
        </div>

        <div className="p-4 rounded-xl bg-industrial-900 border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-400">Deterministic Seed</span>
          <div className="text-xl font-bold font-mono text-slate-200 mt-1">
            {status?.seed ?? 42}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-industrial-900 border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-400">Simulation Ticks</span>
          <div className="text-xl font-bold font-mono text-slate-200 mt-1">
            {status?.tick_count ?? 0}
          </div>
        </div>
      </div>

      {/* Target Asset Selector & Configuration */}
      <div className="p-6 rounded-2xl bg-industrial-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Select Target Asset For Fault Injection
            </h3>
            <p className="text-xs text-slate-400">
              Inject mechanical and thermal anomalies to test digital twin health engine & alerts
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Intensity Multiplier:</span>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={intensity}
              onChange={(e) => setIntensity(parseFloat(e.target.value))}
              className="w-24 accent-cyan-500"
            />
            <span className="text-xs font-mono font-bold text-cyan-400">{intensity.toFixed(1)}x</span>
          </div>
        </div>

        {/* Asset Radio Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {assets.map((asset) => {
            const isSelected = selectedAssetId === asset.id;
            const live = liveAssets[asset.id];
            const curScore = live?.health_score ?? asset.health_score;
            const curCondition = live?.health_condition ?? asset.health_condition;
            const hasActiveScenario = status?.active_scenarios?.[asset.id];

            return (
              <div
                key={asset.id}
                onClick={() => setSelectedAssetId(asset.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500/50 shadow-lg'
                    : 'border-slate-800 bg-industrial-950 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      {asset.asset_type.replace('_', ' ')}
                    </span>
                    <div className="text-sm font-bold text-slate-100">{asset.name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{asset.id}</div>
                  </div>
                  <HealthBadge condition={curCondition} score={curScore} size="sm" />
                </div>

                {hasActiveScenario && (
                  <div className="mt-2 text-[10px] font-mono text-rose-400 bg-rose-950/50 border border-rose-800/50 px-2 py-0.5 rounded flex items-center gap-1">
                    <Flame className="w-3 h-3 animate-pulse" />
                    <span>Fault: {hasActiveScenario}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fault Injection Scenarios Grid */}
      <div className="p-6 rounded-2xl bg-industrial-900 border border-slate-800">
        <h3 className="text-base font-semibold text-slate-100 mb-2">
          Predefined Industrial Fault Scenarios
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Select a fault scenario to immediately perturb physical parameters on{' '}
          <span className="font-mono text-cyan-400 font-bold">{selectedAssetId}</span>. Observe
          the live effect on telemetry charts, health scores, and alerts.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            const isActive = activeScenarioOnSelected === sc.id;

            return (
              <div
                key={sc.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${sc.color} ${
                  isActive ? 'ring-2 ring-current' : ''
                }`}
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-2 rounded-lg bg-black/30">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold">{sc.name}</h4>
                  </div>
                  <p className="text-xs opacity-80 leading-relaxed mb-4">{sc.description}</p>
                </div>

                <div className="pt-2 border-t border-current/20 flex items-center justify-between">
                  {isActive ? (
                    <span className="text-xs font-mono font-bold animate-pulse">
                      ● IN PROGRESS
                    </span>
                  ) : (
                    <span className="text-[11px] opacity-60">Ready to inject</span>
                  )}
                  <button
                    onClick={() => handleInjectScenario(sc.id)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-xs font-semibold transition-colors"
                  >
                    {sc.id === 'clear' ? 'Restore Nominal' : 'Trigger Fault'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
