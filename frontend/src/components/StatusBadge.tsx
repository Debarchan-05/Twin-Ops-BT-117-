import React from 'react';
import { OperationalStatus } from '../types';

interface StatusBadgeProps {
  status: OperationalStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let badgeStyle = 'bg-slate-800 text-slate-300 border-slate-700';
  let indicator = 'bg-slate-400';

  if (status === 'running') {
    badgeStyle = 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30';
    indicator = 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse';
  } else if (status === 'stopped') {
    badgeStyle = 'bg-slate-800 text-slate-300 border-slate-700';
    indicator = 'bg-slate-500';
  } else if (status === 'offline') {
    badgeStyle = 'bg-red-950/40 text-red-400 border-red-800/40';
    indicator = 'bg-red-500';
  }

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${sizeClasses} ${badgeStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${indicator}`} />
      <span className="capitalize">{status}</span>
    </span>
  );
};
