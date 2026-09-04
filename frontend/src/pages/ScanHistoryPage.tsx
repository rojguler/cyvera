import React, { useState, useEffect } from 'react';
import { History, Search, ArrowUpRight, ArrowDownRight, Minus, ExternalLink, Activity, Filter } from 'lucide-react';
import api from '../api/client';
import { Scan, Target } from '../types';

interface ScanHistoryPageProps {
  onOpenScan: (scanId: string) => void;
}

export const ScanHistoryPage: React.FC<ScanHistoryPageProps> = ({ onOpenScan }) => {
  const [scans, setScans] = useState<Scan[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedTarget]);

  const fetchData = async () => {
    try {
      const [scansRes, targetsRes] = await Promise.all([
        api.get<Scan[]>('/scans', {
          params: selectedTarget !== 'all' ? { target_id: selectedTarget } : {}
        }),
        api.get<Target[]>('/targets')
      ]);
      setScans(scansRes.data);
      setTargets(targetsRes.data);
    } catch (err) {
      console.error("Failed to load scan history:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-purple-400" />
            <span>Scan History & Comparisons</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Historical record of security assessments, vulnerability trends, and posture shifts.
          </p>
        </div>

        {/* Target Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            className="cyber-input text-xs py-1.5"
          >
            <option value="all">All Monitored Targets</option>
            {targets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scans List Table */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
          <Activity className="w-6 h-6 text-cyan-400 animate-spin" />
          <span>Retrieving Historical Records...</span>
        </div>
      ) : scans.length === 0 ? (
        <div className="cyber-card p-12 text-center text-xs text-slate-400">
          No historical scan records located for the selected filter.
        </div>
      ) : (
        <div className="cyber-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider bg-slate-900/60">
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Target Application</th>
                <th className="py-3.5 px-4">Profile</th>
                <th className="py-3.5 px-4">Engine</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Security Score</th>
                <th className="py-3.5 px-4">Severity Tally</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {scans.map((scan) => (
                <tr key={scan.id} className="hover:bg-slate-850/40 transition-colors">
                  <td className="py-4 px-4 font-mono text-slate-300">
                    {new Date(scan.created_at).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 font-bold text-white">
                    <div>{scan.target_name}</div>
                    <div className="text-[11px] font-mono text-slate-500 font-normal truncate max-w-xs">{scan.target_url}</div>
                  </td>
                  <td className="py-4 px-4 uppercase font-bold text-slate-400 text-[11px]">
                    {scan.scan_type}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      scan.scan_engine === 'zap'
                        ? 'bg-blue-950/70 text-blue-400 border border-blue-500/30'
                        : 'bg-purple-950/70 text-purple-300 border border-purple-500/30'
                    }`}>
                      {scan.scan_engine === 'zap' ? 'OWASP ZAP' : 'Fallback'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
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
                  <td className="py-4 px-4 font-extrabold text-sm">
                    {scan.security_score !== null && scan.security_score !== undefined ? (
                      <span className={scan.security_score >= 80 ? 'text-emerald-400' : scan.security_score >= 60 ? 'text-amber-400' : 'text-red-400'}>
                        {scan.security_score}/100
                      </span>
                    ) : (
                      <span className="text-slate-500">--</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-red-400 font-semibold">{scan.severity_breakdown?.critical || 0}C</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-orange-400 font-semibold">{scan.severity_breakdown?.high || 0}H</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-amber-400 font-semibold">{scan.severity_breakdown?.medium || 0}M</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => onOpenScan(scan.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                    >
                      <span>View Report</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
