import React from 'react';
import { HealthCondition } from '../types';

interface HealthBadgeProps {
  condition: HealthCondition;
  score?: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const HealthBadge: React.FC<HealthBadgeProps> = ({
  condition,
  score,
  showScore = true,
  size = 'md',
}) => {
  let colorStyles = 'bg-slate-800 text-slate-300 border-slate-700';
  let dotColor = 'bg-slate-400';

  if (condition === 'healthy') {
    colorStyles = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30';
    dotColor = 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]';
  } else if (condition === 'degraded') {
    colorStyles = 'bg-amber-950/60 text-amber-300 border-amber-500/30';
    dotColor = 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]';
  } else if (condition === 'critical') {
    colorStyles = 'bg-rose-950/60 text-rose-300 border-rose-500/40 animate-pulse';
    dotColor = 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.9)]';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border transition-colors ${sizeClasses} ${colorStyles}`}
    >
      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
      <span className="capitalize">{condition}</span>
      {showScore && score !== undefined && (
        <span className="font-mono opacity-90 pl-1 border-l border-current/20">
          {score.toFixed(1)}%
        </span>
      )}
    </span>
  );
};
