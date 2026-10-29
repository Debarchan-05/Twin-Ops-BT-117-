import React, { useState } from 'react';
import {
  LayoutDashboard,
  Boxes,
  Bell,
  Wrench,
  Sliders,
  Radio,
  Menu,
  X,
  Play,
  Pause,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { ConnectionStatus } from '../services/websocket';
import { SimulationStatus } from '../types';

interface LayoutProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  connectionStatus: ConnectionStatus;
  simulationStatus?: SimulationStatus | null;
  onToggleSimulation?: () => void;
  activeAlertCount?: number;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  setCurrentTab,
  connectionStatus,
  simulationStatus,
  onToggleSimulation,
  activeAlertCount = 0,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'assets', label: 'Asset Explorer', icon: Boxes },
    {
      id: 'alerts',
      label: 'Alerts Center',
      icon: Bell,
      badge: activeAlertCount > 0 ? activeAlertCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    { id: 'maintenance', label: 'Maintenance Mgmt', icon: Wrench },
    { id: 'simulation', label: 'Simulation Controls', icon: Sliders },
  ];

  const getConnectionBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-950/70 border border-emerald-500/30 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            WS Live
          </span>
        );
      case 'polling':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-amber-950/70 border border-amber-500/30 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            REST Fallback
          </span>
        );
      case 'connecting':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-cyan-950/70 border border-cyan-500/30 text-cyan-400">
            <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
            Connecting...
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-rose-950/70 border border-rose-500/30 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Offline
          </span>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-industrial-950 text-slate-100 font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:w-64 flex-col bg-industrial-900 border-r border-slate-800/80">
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-white shadow-lg shadow-cyan-500/20">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              TwinOps
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                v1.0
              </span>
            </h1>
            <p className="text-xs text-slate-400">Industrial Digital Twin</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 text-xs font-mono font-bold rounded-full ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Simulator Mini-Widget in Sidebar */}
        <div className="p-4 m-3 rounded-xl bg-industrial-950 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-slate-400">Engine State</span>
            {simulationStatus?.is_running ? (
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            ) : (
              <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Paused
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 font-mono space-y-1 mb-3">
            <div className="flex justify-between">
              <span>Rate:</span>
              <span className="text-slate-200">{simulationStatus?.interval_seconds ?? 2}s</span>
            </div>
            <div className="flex justify-between">
              <span>Ticks:</span>
              <span className="text-slate-200">{simulationStatus?.tick_count ?? 0}</span>
            </div>
          </div>
          <button
            onClick={onToggleSimulation}
            className={`w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors border ${
              simulationStatus?.is_running
                ? 'bg-amber-950/40 text-amber-300 border-amber-800 hover:bg-amber-900/40'
                : 'bg-emerald-950/40 text-emerald-300 border-emerald-800 hover:bg-emerald-900/40'
            }`}
          >
            {simulationStatus?.is_running ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause Sim
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Resume Sim
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800/80 bg-industrial-900/80 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Infrastructure Operations & Predictive Health
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {getConnectionBadge()}
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 bg-industrial-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Simulated I/O Feed</span>
            </div>
          </div>
        </header>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-industrial-900 border-b border-slate-800 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-full bg-rose-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Body Content Viewport */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
