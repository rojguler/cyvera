import React from 'react';
import { ShieldAlert, AlertTriangle, AlertCircle, Info, HelpCircle } from 'lucide-react';
import { VulnerabilitySeverity } from '../types';

interface SeverityBadgeProps {
  severity: VulnerabilitySeverity | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  size = 'sm',
  showIcon = true
}) => {
  const sevLower = (severity || 'informational').toLowerCase();

  const configs: Record<string, { label: string; icon: any; bg: string; text: string; border: string; glow: string }> = {
    critical: {
      label: 'Critical',
      icon: ShieldAlert,
      bg: 'bg-rose-950/70',
      text: 'text-rose-400',
      border: 'border-rose-500/50',
      glow: 'shadow-[0_0_12px_-2px_rgba(244,63,94,0.35)]',
    },
    high: {
      label: 'High',
      icon: AlertTriangle,
      bg: 'bg-orange-950/70',
      text: 'text-orange-400',
      border: 'border-orange-500/50',
      glow: 'shadow-[0_0_12px_-2px_rgba(249,115,22,0.35)]',
    },
    medium: {
      label: 'Medium',
      icon: AlertCircle,
      bg: 'bg-amber-950/70',
      text: 'text-amber-400',
      border: 'border-amber-500/50',
      glow: 'shadow-[0_0_12px_-2px_rgba(245,158,11,0.35)]',
    },
    low: {
      label: 'Low',
      icon: Info,
      bg: 'bg-sky-950/70',
      text: 'text-sky-400',
      border: 'border-sky-500/50',
      glow: 'shadow-[0_0_12px_-2px_rgba(56,189,248,0.35)]',
    },
    informational: {
      label: 'Info',
      icon: HelpCircle,
      bg: 'bg-slate-900/80',
      text: 'text-slate-400',
      border: 'border-slate-700/60',
      glow: '',
    },
    info: {
      label: 'Info',
      icon: HelpCircle,
      bg: 'bg-slate-900/80',
      text: 'text-slate-400',
      border: 'border-slate-700/60',
      glow: '',
    }
  };

  const config = configs[sevLower] || configs.informational;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wider rounded-md border ${config.bg} ${config.text} ${config.border} ${config.glow} ${sizeClasses[size]} backdrop-blur-sm transition-all`}
    >
      {showIcon && <Icon className={`${iconSizes[size]} shrink-0`} />}
      <span>{config.label}</span>
    </span>
  );
};
