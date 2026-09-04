import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  badgeText?: string;
  badgeColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-cyan-400',
  iconBg = 'bg-cyan-950/50 border-cyan-500/30',
  badgeText,
  badgeColor = 'text-emerald-400 bg-emerald-950/50 border-emerald-500/30'
}) => {
  return (
    <div className="cyber-card p-5 relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1.5 tracking-tight">{value}</h3>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl border ${iconBg} ${iconColor} transition-transform group-hover:scale-105 duration-200`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {badgeText && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${badgeColor}`}>
            {badgeText}
          </span>
        </div>
      )}
    </div>
  );
};
