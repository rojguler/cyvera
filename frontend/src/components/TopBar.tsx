import React from 'react';
import { Plus, ShieldCheck, Activity, Bell } from 'lucide-react';

interface TopBarProps {
  onStartNewScan: () => void;
  activeScanCount?: number;
}

export const TopBar: React.FC<TopBarProps> = ({ onStartNewScan, activeScanCount = 0 }) => {
  return (
    <header className="h-16 bg-cyber-900/90 backdrop-blur border-b border-slate-800 flex items-center justify-between px-8 z-10">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Scanner Engine Online</span>
        </div>

        {activeScanCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-xs font-semibold animate-pulse">
            <Activity className="w-3.5 h-3.5" />
            <span>{activeScanCount} Scan in Progress</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onStartNewScan}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-glow-cyan"
        >
          <Plus className="w-4 h-4" />
          <span>New Target Scan</span>
        </button>
      </div>
    </header>
  );
};
