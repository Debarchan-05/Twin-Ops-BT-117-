import React from 'react';
import { AssetType, HealthCondition, OperationalStatus, SensorStatusDetail } from '../types';
import { Activity, Flame, Gauge, Zap, Wind, Droplets } from 'lucide-react';

interface AssetSchematicProps {
  assetType: AssetType;
  operationalStatus: OperationalStatus;
  healthCondition: HealthCondition;
  metrics: Record<string, number>;
  sensorStatuses?: Record<string, SensorStatusDetail>;
}

export const AssetSchematic: React.FC<AssetSchematicProps> = ({
  assetType,
  operationalStatus,
  healthCondition,
  metrics,
  sensorStatuses,
}) => {
  const isRunning = operationalStatus === 'running';

  const getSensorColor = (key: string) => {
    const status = sensorStatuses?.[key]?.status;
    if (status === 'critical') return 'text-rose-400 bg-rose-950/80 border-rose-500 ring-rose-500/50';
    if (status === 'warning') return 'text-amber-400 bg-amber-950/80 border-amber-500 ring-amber-500/50';
    return 'text-emerald-400 bg-emerald-950/80 border-emerald-500/50 ring-emerald-500/30';
  };

  const getAuraColor = () => {
    if (!isRunning) return 'stroke-slate-700';
    if (healthCondition === 'critical') return 'stroke-rose-500 filter drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]';
    if (healthCondition === 'degraded') return 'stroke-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]';
    return 'stroke-cyan-400 filter drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]';
  };

  return (
    <div className="relative w-full rounded-2xl bg-gradient-to-b from-industrial-900 to-industrial-950 border border-slate-800 p-6 overflow-hidden shadow-2xl">
      {/* Background blueprint grid pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#38bdf8 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px',
        }}
      />

      {/* Schematic Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
        <div>
          <span className="text-xs font-mono tracking-widest uppercase text-cyan-400">
            Digital Twin Virtual Rig
          </span>
          <h4 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            {assetType === 'electric_motor' && '3-Phase Induction Motor Assembly'}
            {assetType === 'water_pump' && 'Centrifugal Multistage Pump Architecture'}
            {assetType === 'industrial_fan' && 'Heavy-Duty Aerofoil Exhaust Fan Unit'}
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              Live Schematic
            </span>
          </h4>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Shaft State:</span>
          <span className={`px-2 py-0.5 rounded font-semibold ${isRunning ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-800 text-slate-400'}`}>
            {isRunning ? 'ROTATING' : 'LOCKED'}
          </span>
        </div>
      </div>

      {/* SVG Diagram Viewport */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-6 py-4">
        <div className="relative w-full max-w-[420px] aspect-[4/3] flex items-center justify-center">
          {/* 1. ELECTRIC MOTOR SCHEMATIC */}
          {assetType === 'electric_motor' && (
            <svg viewBox="0 0 400 300" className="w-full h-full">
              {/* Ground & base mount */}
              <rect x="50" y="230" width="300" height="20" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="2" />
              <rect x="80" y="210" width="50" height="20" fill="#334155" />
              <rect x="270" y="210" width="50" height="20" fill="#334155" />

              {/* Main stator cylindrical casing */}
              <rect x="100" y="70" width="200" height="140" rx="16" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" className={getAuraColor()} />

              {/* Cooling ribs */}
              {[120, 140, 160, 180, 200, 220, 240, 260, 280].map((x) => (
                <line key={x} x1={x} y1="70" x2={x} y2="210" stroke="#1e293b" strokeWidth="3" strokeDasharray="6,4" />
              ))}

              {/* Terminal junction box on top */}
              <rect x="160" y="35" width="80" height="35" rx="4" fill="#1e293b" stroke="#0ea5e9" strokeWidth="2" />
              <circle cx="180" cy="52" r="4" fill="#f59e0b" />
              <circle cx="200" cy="52" r="4" fill="#06b6d4" />
              <circle cx="220" cy="52" r="4" fill="#10b981" />

              {/* Rotor Drive Shaft (protruding to the right) */}
              <rect x="300" y="125" width="70" height="30" rx="3" fill="#475569" stroke="#94a3b8" strokeWidth="2" />
              <circle cx="370" cy="140" r="15" fill="#334155" stroke="#94a3b8" strokeWidth="2" />

              {/* Rotating coupling marker */}
              <g
                className={isRunning ? 'origin-[370px_140px] animate-spin' : ''}
                style={{ animationDuration: '1.2s' }}
              >
                <line x1="370" y1="125" x2="370" y2="155" stroke="#38bdf8" strokeWidth="4" />
                <line x1="355" y1="140" x2="385" y2="140" stroke="#38bdf8" strokeWidth="4" />
              </g>

              {/* Drive-End Bearing block */}
              <rect x="280" y="100" width="25" height="80" rx="4" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />
              {/* Non-Drive End Bearing block */}
              <rect x="95" y="100" width="25" height="80" rx="4" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />

              {/* Fan cowl at left */}
              <path d="M 95 90 L 60 110 L 60 170 L 95 190 Z" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
              <g className={isRunning ? 'origin-[75px_140px] animate-spin' : ''} style={{ animationDuration: '0.8s' }}>
                <circle cx="75" cy="140" r="12" fill="#0f172a" stroke="#0284c7" strokeWidth="2" />
                <path d="M 75 128 L 75 152 M 63 140 L 87 140" stroke="#0284c7" strokeWidth="3" />
              </g>
            </svg>
          )}

          {/* 2. WATER PUMP SCHEMATIC */}
          {assetType === 'water_pump' && (
            <svg viewBox="0 0 400 300" className="w-full h-full">
              {/* Foundation */}
              <rect x="40" y="240" width="320" height="20" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="2" />
              <rect x="70" y="215" width="40" height="25" fill="#334155" />
              <rect x="250" y="215" width="40" height="25" fill="#334155" />

              {/* Pump Volute Spiral Casing */}
              <circle cx="160" cy="140" r="75" fill="#0f172a" stroke="#06b6d4" strokeWidth="3" className={getAuraColor()} />
              <circle cx="160" cy="140" r="50" fill="#1e293b" stroke="#334155" strokeWidth="2" />

              {/* Discharge Pipe Nozzle (pointing upward) */}
              <rect x="180" y="30" width="45" height="70" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
              <rect x="175" y="20" width="55" height="12" rx="2" fill="#1e293b" stroke="#06b6d4" strokeWidth="2" />

              {/* Suction Flange (entering from left) */}
              <rect x="40" y="120" width="55" height="40" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
              <rect x="30" y="115" width="12" height="50" rx="2" fill="#1e293b" stroke="#06b6d4" strokeWidth="2" />

              {/* Rotating Impeller Vanes */}
              <g
                className={isRunning ? 'origin-[160px_140px] animate-spin' : ''}
                style={{ animationDuration: '1.0s' }}
              >
                <circle cx="160" cy="140" r="16" fill="#0284c7" />
                <path d="M 160 140 Q 185 110 205 130" stroke="#38bdf8" strokeWidth="4" fill="none" />
                <path d="M 160 140 Q 135 170 115 150" stroke="#38bdf8" strokeWidth="4" fill="none" />
                <path d="M 160 140 Q 190 165 170 185" stroke="#38bdf8" strokeWidth="4" fill="none" />
                <path d="M 160 140 Q 130 115 150 95" stroke="#38bdf8" strokeWidth="4" fill="none" />
              </g>

              {/* Motor drive coupling housing to right */}
              <rect x="235" y="115" width="85" height="50" rx="6" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
              <rect x="320" y="100" width="55" height="80" rx="8" fill="#090d16" stroke="#475569" strokeWidth="2" />
            </svg>
          )}

          {/* 3. INDUSTRIAL FAN SCHEMATIC */}
          {assetType === 'industrial_fan' && (
            <svg viewBox="0 0 400 300" className="w-full h-full">
              {/* Foundation */}
              <rect x="60" y="240" width="280" height="20" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="2" />
              <rect x="160" y="200" width="80" height="40" fill="#334155" />

              {/* Circular Duct Casing */}
              <circle cx="200" cy="120" r="90" fill="#0f172a" stroke="#8b5cf6" strokeWidth="3" className={getAuraColor()} />
              <circle cx="200" cy="120" r="80" fill="#131e35" stroke="#334155" strokeWidth="1" />

              {/* Hub motor core */}
              <circle cx="200" cy="120" r="28" fill="#1e293b" stroke="#cbd5e1" strokeWidth="2" />

              {/* Spinning Fan Blades */}
              <g
                className={isRunning ? 'origin-[200px_120px] animate-spin' : ''}
                style={{ animationDuration: '0.9s' }}
              >
                {[0, 60, 120, 180, 240, 300].map((deg) => (
                  <g key={deg} transform={`rotate(${deg} 200 120)`}>
                    <path
                      d="M 200 120 L 212 55 C 205 45 195 45 188 55 Z"
                      fill="#8b5cf6"
                      stroke="#c4b5fd"
                      strokeWidth="1.5"
                    />
                  </g>
                ))}
              </g>

              {/* Airflow vector arrows */}
              {isRunning && (
                <g className="text-cyan-400 opacity-80 animate-pulse">
                  <path d="M 60 120 L 95 120 M 85 110 L 95 120 L 85 130" stroke="#06b6d4" strokeWidth="2" fill="none" />
                  <path d="M 305 120 L 340 120 M 330 110 L 340 120 L 330 130" stroke="#06b6d4" strokeWidth="2" fill="none" />
                </g>
              )}
            </svg>
          )}
        </div>

        {/* Live Hotspot Telemetry Overlays */}
        <div className="flex-1 w-full grid grid-cols-2 gap-3">
          {/* Temperature Pin */}
          {metrics.temperature !== undefined && (
            <div className={`p-3 rounded-xl border ring-1 transition-all flex items-center gap-3 ${getSensorColor('temperature')}`}>
              <div className="p-2 rounded-lg bg-black/20">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider opacity-80">Temperature</div>
                <div className="text-base font-bold font-mono">
                  {metrics.temperature.toFixed(1)} <span className="text-xs font-normal">°C</span>
                </div>
              </div>
            </div>
          )}

          {/* Vibration Pin */}
          {metrics.vibration !== undefined && (
            <div className={`p-3 rounded-xl border ring-1 transition-all flex items-center gap-3 ${getSensorColor('vibration')}`}>
              <div className="p-2 rounded-lg bg-black/20">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider opacity-80">Vibration RMS</div>
                <div className="text-base font-bold font-mono">
                  {metrics.vibration.toFixed(2)} <span className="text-xs font-normal">mm/s</span>
                </div>
              </div>
            </div>
          )}

          {/* Rotational Speed / RPM */}
          {metrics.rotational_speed !== undefined && (
            <div className={`p-3 rounded-xl border ring-1 transition-all flex items-center gap-3 ${getSensorColor('rotational_speed')}`}>
              <div className="p-2 rounded-lg bg-black/20">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider opacity-80">Shaft Speed</div>
                <div className="text-base font-bold font-mono">
                  {metrics.rotational_speed.toFixed(0)} <span className="text-xs font-normal">RPM</span>
                </div>
              </div>
            </div>
          )}

          {/* Motor Current */}
          {metrics.electrical_current !== undefined && (
            <div className={`p-3 rounded-xl border ring-1 transition-all flex items-center gap-3 ${getSensorColor('electrical_current')}`}>
              <div className="p-2 rounded-lg bg-black/20">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider opacity-80">Phase Current</div>
                <div className="text-base font-bold font-mono">
                  {metrics.electrical_current.toFixed(1)} <span className="text-xs font-normal">A</span>
                </div>
              </div>
            </div>
          )}

          {/* Flow Rate */}
          {metrics.flow_rate !== undefined && (
            <div className={`p-3 rounded-xl border ring-1 transition-all flex items-center gap-3 ${getSensorColor('flow_rate')}`}>
              <div className="p-2 rounded-lg bg-black/20">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider opacity-80">Flow Rate</div>
                <div className="text-base font-bold font-mono">
                  {metrics.flow_rate.toFixed(1)} <span className="text-xs font-normal">m³/h</span>
                </div>
              </div>
            </div>
          )}

          {/* Pressure */}
          {metrics.pressure !== undefined && (
            <div className={`p-3 rounded-xl border ring-1 transition-all flex items-center gap-3 ${getSensorColor('pressure')}`}>
              <div className="p-2 rounded-lg bg-black/20">
                <Wind className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider opacity-80">Discharge Head</div>
                <div className="text-base font-bold font-mono">
                  {metrics.pressure.toFixed(2)} <span className="text-xs font-normal">bar</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
