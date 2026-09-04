import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

interface ScoreGaugeProps {
  score: number;
  size?: number;
  label?: string;
  animate?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  size = 190,
  label = "Security Posture Score",
  animate = true
}) => {
  const [displayedScore, setDisplayedScore] = useState(animate ? 0 : score);

  useEffect(() => {
    if (!animate) {
      setDisplayedScore(score);
      return;
    }

    let start = 0;
    const duration = 900; // ms
    const startTime = performance.now();

    const animateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentScore = Math.round(easeProgress * score);
      setDisplayedScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };

    const handle = requestAnimationFrame(animateCount);
    return () => cancelAnimationFrame(handle);
  }, [score, animate]);

  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (displayedScore / 100) * circumference;

  let gradientId = 'gauge-emerald';
  let primaryColor = '#10b981';
  let ratingText = 'SECURE POSTURE';
  let Icon = ShieldCheck;
  let bgGlow = 'rgba(16, 185, 129, 0.15)';

  if (score < 60) {
    gradientId = 'gauge-critical';
    primaryColor = '#f43f5e';
    ratingText = 'CRITICAL RISK';
    Icon = ShieldAlert;
    bgGlow = 'rgba(244, 63, 94, 0.18)';
  } else if (score < 80) {
    gradientId = 'gauge-warning';
    primaryColor = '#f59e0b';
    ratingText = 'MODERATE RISK';
    Icon = AlertTriangle;
    bgGlow = 'rgba(245, 158, 11, 0.18)';
  } else if (score < 95) {
    gradientId = 'gauge-good';
    primaryColor = '#06b6d4';
    ratingText = 'GOOD POSTURE';
    Icon = ShieldCheck;
    bgGlow = 'rgba(6, 182, 212, 0.18)';
  }

  return (
    <div className="flex flex-col items-center justify-center p-3 relative">
      {/* Soft Ambient Radial Glow */}
      <div
        className="absolute rounded-full pointer-events-none filter blur-2xl transition-all duration-700"
        style={{
          width: size * 0.9,
          height: size * 0.9,
          background: bgGlow,
        }}
      />

      <div className="relative flex items-center justify-center z-10" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <defs>
            <linearGradient id="gauge-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="gauge-good" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
            <linearGradient id="gauge-warning" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="gauge-critical" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>

          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#111c38"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
          />

          {/* Inner Accent Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius - strokeWidth * 0.75}
            stroke="rgba(30, 47, 94, 0.4)"
            strokeWidth={1}
            strokeDasharray="4 4"
            fill="transparent"
          />

          {/* Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute flex flex-col items-center justify-center text-center select-none">
          <div className="flex items-baseline">
            <span
              className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-md font-mono"
              style={{ color: primaryColor }}
            >
              {displayedScore}
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 font-mono">
            / 100
          </span>
        </div>
      </div>

      {/* Status Label & Badge */}
      <div className="mt-3 text-center z-10 space-y-1">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider backdrop-blur-md"
          style={{
            color: primaryColor,
            borderColor: `${primaryColor}40`,
            backgroundColor: `${primaryColor}15`,
          }}
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{ratingText}</span>
        </div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
      </div>
    </div>
  );
};
