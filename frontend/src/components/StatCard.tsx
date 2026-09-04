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
  iconColor = "text-cyan-400",
  iconBg = "bg-cyan-950/60 border-cyan-500/30",
  badgeText,
  badgeColor = "text-cyan-400 bg-cyan-950/50 border-cyan-500/30"
}) => {
  return (
    <div className="cyber-card p-5 flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 group">
      <div>
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {title}
          </span>
          <div className={`p-2.5 rounded-xl border ${iconBg} ${iconColor} transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
            {value}
          </span>
        </div>

        {subtitle && (
          <p className="text-xs text-slate-400 mt-1 font-medium truncate">
            {subtitle}
          </p>
        )}
      </div>

      {badgeText && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${badgeColor}`}>
            {badgeText}
          </span>
        </div>
      )}
    </div>
  );
};
