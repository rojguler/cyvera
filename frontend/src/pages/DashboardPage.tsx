import React, { useEffect, useState } from 'react';
import {
  Shield,
  Target,
  ScanSearch,
  AlertOctagon,
  TrendingUp,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Activity
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Cell
} from 'recharts';
import api from '../api/client';
import { DashboardStats } from '../types';
import { ScoreGauge } from '../components/ScoreGauge';
import { StatCard } from '../components/StatCard';
import { SeverityBadge } from '../components/SeverityBadge';

interface DashboardPageProps {
  onNavigate: (tab: string, scanId?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get<DashboardStats>('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load dashboard statistics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Aggregating Security Telemetry...
          </p>
        </div>
      </div>
    );
  }

  const severityChartData = [
    { name: 'Critical', count: stats.severity_breakdown.critical, color: '#ef4444' },
    { name: 'High', count: stats.severity_breakdown.high, color: '#f97316' },
    { name: 'Medium', count: stats.severity_breakdown.medium, color: '#f59e0b' },
    { name: 'Low', count: stats.severity_breakdown.low, color: '#3b82f6' },
    { name: 'Info', count: stats.severity_breakdown.informational, color: '#64748b' },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Headline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Security Posture Overview</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              Live
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time vulnerability metrics, OWASP Top 10 classifications, and AI remediation status.
          </p>
        </div>

        <button
          onClick={() => onNavigate('new-scan')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-glow-cyan shrink-0"
        >
          <ScanSearch className="w-4 h-4" />
          <span>Launch Security Scan</span>
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monitored Targets"
          value={stats.total_targets}
          subtitle="Authorized applications"
          icon={Target}
          iconColor="text-cyan-400"
          iconBg="bg-cyan-950/60 border-cyan-500/30"
          badgeText="+ Active Target Scope"
        />

        <StatCard
          title="Total Scans Executed"
          value={stats.total_scans}
          subtitle="Automated assessments"
          icon={ScanSearch}
          iconColor="text-purple-400"
          iconBg="bg-purple-950/60 border-purple-500/30"
          badgeText="OWASP ZAP Engine"
          badgeColor="text-purple-400 bg-purple-950/50 border-purple-500/30"
        />

        <StatCard
          title="Critical / High Risks"
          value={stats.severity_breakdown.critical + stats.severity_breakdown.high}
          subtitle="Immediate action required"
          icon={AlertOctagon}
          iconColor="text-red-400"
          iconBg="bg-red-950/60 border-red-500/30"
          badgeText="Severity Priority 1"
          badgeColor="text-red-400 bg-red-950/50 border-red-500/30"
        />

        <StatCard
          title="Average Posture Score"
          value={`${stats.average_security_score}/100`}
          subtitle="Across all target assets"
          icon={Shield}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-950/60 border-emerald-500/30"
          badgeText="Deterministic Engine"
        />
      </div>

      {/* Main Gauges & Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Security Score Gauge Card */}
        <div className="cyber-card p-6 flex flex-col justify-between items-center text-center">
          <div className="w-full text-left">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Overall Security Score
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Weighted calculation based on identified vulnerabilities.
            </p>
          </div>

          <ScoreGauge score={stats.latest_security_score} size={200} />

          <div className="w-full pt-4 border-t border-slate-800/80 flex items-center justify-around text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Findings</span>
              <span className="font-bold text-white text-sm">{stats.severity_breakdown.total}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Critical</span>
              <span className="font-bold text-red-400 text-sm">{stats.severity_breakdown.critical}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">High</span>
              <span className="font-bold text-orange-400 text-sm">{stats.severity_breakdown.high}</span>
            </div>
          </div>
        </div>

        {/* Vulnerability Severity Distribution Chart */}
        <div className="cyber-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Severity Distribution
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Finding counts categorized by risk severity tiers.
            </p>
          </div>

          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  cursor={{ fill: 'rgba(51, 65, 85, 0.3)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {severityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-800">
            <span>Critical & High: {stats.severity_breakdown.critical + stats.severity_breakdown.high}</span>
            <span>Low & Info: {stats.severity_breakdown.low + stats.severity_breakdown.informational}</span>
          </div>
        </div>

        {/* OWASP Top 10 Categories */}
        <div className="cyber-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              OWASP Top 10 Breakdown
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Identified vulnerabilities mapped to standard categories.
            </p>
          </div>

          <div className="space-y-3 my-4">
            {stats.owasp_distribution.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No OWASP categories recorded yet. Run a scan to populate.
              </div>
            ) : (
              stats.owasp_distribution.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300 truncate max-w-[200px]">{item.category}</span>
                    <span className="text-cyan-400">{item.count} findings</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-cyan-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, (item.count / (stats.severity_breakdown.total || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => onNavigate('vulnerabilities')}
            className="w-full py-2 rounded bg-slate-850 hover:bg-slate-800 text-cyan-400 text-xs font-bold uppercase tracking-wider border border-slate-700/60 transition-all flex items-center justify-center gap-1.5"
          >
            <span>Explore Vulnerabilities</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Security Trends Chart */}
      {stats.score_trends.length > 1 && (
        <div className="cyber-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Security Posture Trends Over Time</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tracking overall score progression and posture changes across scan sessions.
              </p>
            </div>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.score_trends} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2d4a" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={{ fill: '#06b6d4', r: 4 }}
                  activeDot={{ r: 6, fill: '#38bdf8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Scans Table */}
      <div className="cyber-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Recent Security Scans
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Latest assessment runs and recorded risk scores.
            </p>
          </div>

          <button
            onClick={() => onNavigate('history')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
          >
            <span>View All History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Target Application</th>
                <th className="py-3 px-4">Scan Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Findings Breakdown</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {stats.recent_scans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No scans have been initiated yet. Add a target and launch your first scan!
                  </td>
                </tr>
              ) : (
                stats.recent_scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div>{scan.target_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono font-normal truncate max-w-xs">{scan.target_url}</div>
                    </td>
                    <td className="py-3.5 px-4 uppercase font-bold text-slate-400">
                      {scan.scan_type}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        scan.status === 'completed'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                          : scan.status === 'running'
                          ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {scan.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      {scan.security_score !== null && scan.security_score !== undefined ? (
                        <span className={scan.security_score >= 80 ? 'text-emerald-400' : scan.security_score >= 60 ? 'text-amber-400' : 'text-red-400'}>
                          {scan.security_score}/100
                        </span>
                      ) : (
                        <span className="text-slate-500">--</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-red-400 font-semibold">{scan.severity_breakdown?.critical || 0}C</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-orange-400 font-semibold">{scan.severity_breakdown?.high || 0}H</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-amber-400 font-semibold">{scan.severity_breakdown?.medium || 0}M</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onNavigate('scan-detail', scan.id)}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-1 font-medium"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
