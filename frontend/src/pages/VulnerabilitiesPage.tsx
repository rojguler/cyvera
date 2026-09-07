import React, { useState, useEffect } from 'react';
import { Bug, Search, Sparkles, Filter, ExternalLink, Activity } from 'lucide-react';
import api from '../api/client';
import { ScanFinding } from '../types';
import { SeverityBadge } from '../components/SeverityBadge';
import { AIAnalysisModal } from '../components/AIAnalysisModal';
import { FALLBACK_FINDINGS } from '../utils/fallbackData';

export const VulnerabilitiesPage: React.FC = () => {
  const [findings, setFindings] = useState<ScanFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSev, setSelectedSev] = useState('all');
  const [selectedFinding, setSelectedFinding] = useState<ScanFinding | null>(null);

  useEffect(() => {
    fetchFindings();
  }, [selectedSev]);

  const fetchFindings = async () => {
    try {
      const params: any = {};
      if (selectedSev !== 'all') {
        params.severity = selectedSev;
      }
      const res = await api.get<ScanFinding[]>('/vulnerabilities', { params });
      setFindings(res.data);
    } catch (err) {
      console.warn("Backend API not reachable, loading findings fallback.");
      const filteredSev = selectedSev === 'all'
        ? FALLBACK_FINDINGS
        : FALLBACK_FINDINGS.filter(f => f.severity === selectedSev);
      setFindings(filteredSev);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFinding = (updated: ScanFinding) => {
    setFindings(findings.map(f => f.id === updated.id ? updated : f));
    setSelectedFinding(updated);
  };

  const filtered = findings.filter(f =>
    (f.vulnerability?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    f.affected_url.toLowerCase().includes(search.toLowerCase()) ||
    (f.vulnerability?.owasp_category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Bug className="w-6 h-6 text-rose-400" />
            <span>Vulnerability Explorer</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global catalog of identified security alerts, OWASP categorizations, and remediation guidance.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80 flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search finding, OWASP, CWE or URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="cyber-input w-full pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['all', 'critical', 'high', 'medium', 'low', 'informational'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSev(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
                selectedSev === sev
                  ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-glow-cyan'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {sev === 'informational' ? 'info' : sev}
            </button>
          ))}
        </div>
      </div>

      {/* Vulnerabilities Table */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
          <Activity className="w-6 h-6 text-cyan-400 animate-spin" />
          <span className="font-mono">Querying Security Telemetry Database...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="cyber-card p-12 text-center text-xs text-slate-500">
          No vulnerabilities found matching your filter criteria.
        </div>
      ) : (
        <div className="cyber-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider bg-slate-900/60">
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4">Alert Name</th>
                  <th className="py-3.5 px-4">OWASP / CWE</th>
                  <th className="py-3.5 px-4">Affected URL</th>
                  <th className="py-3.5 px-4 text-right">Remediation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filtered.map((finding) => (
                  <tr key={finding.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-4 px-4">
                      <SeverityBadge severity={finding.severity} size="sm" />
                    </td>
                    <td className="py-4 px-4 font-bold text-white">
                      <div>{finding.vulnerability?.name || "Security Finding"}</div>
                      {finding.parameter && (
                        <span className="text-[11px] text-cyan-400 font-mono font-normal">
                          Param: {finding.parameter}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono">
                        {finding.vulnerability?.owasp_category || "A05:2021"}
                      </span>
                      {finding.vulnerability?.cwe_id && (
                        <span className="ml-1.5 text-[10px] text-slate-400 font-mono">
                          CWE-{finding.vulnerability.cwe_id}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-400 truncate max-w-xs text-[11px]">
                      {finding.affected_url}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setSelectedFinding(finding)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          finding.ai_analysis
                            ? 'bg-gradient-to-r from-cyan-950/90 to-slate-900 border border-cyan-500/50 text-cyan-300 shadow-glow-cyan'
                            : 'bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-slate-300 hover:text-white'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{finding.ai_analysis ? "AI Analysis" : "Generate AI"}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Modal */}
      <AIAnalysisModal
        finding={selectedFinding}
        onClose={() => setSelectedFinding(null)}
        onAnalysisGenerated={handleUpdateFinding}
      />
    </div>
  );
};
