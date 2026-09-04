import React from 'react';

interface SeverityBadgeProps {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const sev = (severity || 'informational').toLowerCase();

  const styles: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    critical: {
      bg: 'bg-red-950/60',
      text: 'text-red-400',
      border: 'border-red-500/40',
      dot: 'bg-red-500',
    },
    high: {
      bg: 'bg-orange-950/60',
      text: 'text-orange-400',
      border: 'border-orange-500/40',
      dot: 'bg-orange-500',
    },
    medium: {
      bg: 'bg-amber-950/60',
      text: 'text-amber-400',
      border: 'border-amber-500/40',
      dot: 'bg-amber-500',
    },
    low: {
      bg: 'bg-blue-950/60',
      text: 'text-blue-400',
      border: 'border-blue-500/40',
      dot: 'bg-blue-500',
    },
    informational: {
      bg: 'bg-slate-900/60',
      text: 'text-slate-400',
      border: 'border-slate-600/40',
      dot: 'bg-slate-500',
    },
  };

  const current = styles[sev] || styles.informational;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider rounded-md border ${current.bg} ${current.text} ${current.border} ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot} animate-pulse`} />
      {sev}
    </span>
  );
};
