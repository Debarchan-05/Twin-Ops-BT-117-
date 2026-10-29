import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'emerald' | 'amber' | 'rose' | 'cyan';
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
}) => {
  const borderVariants = {
    default: 'border-slate-800 hover:border-slate-700 bg-industrial-900/90',
    emerald: 'border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-950/20',
    amber: 'border-amber-500/20 hover:border-amber-500/40 bg-amber-950/20',
    rose: 'border-rose-500/20 hover:border-rose-500/40 bg-rose-950/20',
    cyan: 'border-cyan-500/20 hover:border-cyan-500/40 bg-cyan-950/20',
  };

  const iconVariants = {
    default: 'text-slate-400 bg-slate-800/80',
    emerald: 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/30',
    amber: 'text-amber-400 bg-amber-950/60 border border-amber-500/30',
    rose: 'text-rose-400 bg-rose-950/60 border border-rose-500/30',
    cyan: 'text-cyan-400 bg-cyan-950/60 border border-cyan-500/30',
  };

  return (
    <div
      className={`rounded-xl border p-5 backdrop-blur transition-all duration-200 shadow-lg ${borderVariants[variant]}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          {title}
        </span>
        <div className={`p-2.5 rounded-lg ${iconVariants[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-3xl font-bold font-mono tracking-tight text-slate-100">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-400 truncate">{subtitle}</p>
      )}
    </div>
  );
};
