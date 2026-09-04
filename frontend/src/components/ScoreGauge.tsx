import React from 'react';

interface ScoreGaugeProps {
  score: number;
  size?: number;
  label?: string;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, size = 180, label = "Security Score" }) => {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = '#10b981'; // emerald
  let glowClass = 'shadow-glow-emerald';
  let ratingText = 'SECURE';
  
  if (score < 60) {
    color = '#ef4444'; // critical red
    glowClass = 'shadow-glow-red';
    ratingText = 'CRITICAL RISK';
  } else if (score < 80) {
    color = '#f59e0b'; // amber
    glowClass = 'shadow-glow-cyan';
    ratingText = 'MODERATE RISK';
  } else if (score < 95) {
    color = '#06b6d4'; // cyan
    glowClass = 'shadow-glow-cyan';
    ratingText = 'GOOD POSTURE';
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress stroke */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold tracking-tight" style={{ color }}>
            {score}
          </span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
            / 100
          </span>
        </div>
      </div>

      <div className="mt-3 text-center">
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-700 bg-slate-900/80 uppercase tracking-wider" style={{ color }}>
          {ratingText}
        </span>
        <p className="text-xs text-slate-400 mt-1 font-medium">{label}</p>
      </div>
    </div>
  );
};
