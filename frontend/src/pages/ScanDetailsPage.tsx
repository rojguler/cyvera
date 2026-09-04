import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Download,
  Sparkles,
  ExternalLink,
  Search,
  Filter,
  Shield,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Zap,
  ShieldAlert
} from 'lucide-react';
import api from '../api/client';
import { Scan, ScanFinding } from '../types';
import { ScoreGauge } from '../components/ScoreGauge';
import { SeverityBadge } from '../components/SeverityBadge';
import { AIAnalysisModal } from '../components/AIAnalysisModal';

interface ScanDetailsPageProps {
  scanId: string;
  onBack: () => void;
}

export const ScanDetailsPage: React.FC<ScanDetailsPageProps> = ({ scanId, onBack }) => {
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [selectedFinding, setSelectedFinding] = useState<ScanFinding | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null);

  useEffect(() => {
    fetchScanDetails();
  }, [scanId]);

  const fetchScanDetails = async () => {
    try {
      const res = await api.get<Scan>(`/scans/${scanId}`);
      setScan(res.data);
    } catch (err) {
      console.error("Failed to load scan details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!scan) return;
    setDownloadingPdf(true);
    try {
      const response = await api.get(`/reports/scans/${scan.id}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Cyvera_Assessment_${scan.id.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrlId(id);
    setTimeout(() => setCopiedUrlId(null), 2000);
  };

  const handleUpdateFinding = (updated: ScanFinding) => {
    if (!scan || !scan.findings) return;
    const updatedFindings = scan.findings.map(f => f.id === updated.id ? updated : f);
    setScan({ ...scan, findings: updatedFindings });
    setSelectedFinding(updated);
  };

  if (loading || !scan) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
            <Activity className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-xs text-slate-400 uppercase font-bold tracking-widest font-mono">
            Loading Scan Findings & Telemetry...
          </p>
        </div>
      </div>
    );
  }

  const findings = scan.findings || [];

  const filteredFindings = findings.filter(f => {
    const matchesSearch =
      (f.vulnerability?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.affected_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.vulnerability?.owasp_category || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSev = severityFilter === 'all' || f.severity === severityFilter;
    return matchesSearch && matchesSev;
  });

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all shadow-sm shrink-0"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-white">{scan.target_name}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 uppercase font-mono">
                {scan.scan_type}
              </span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border uppercase font-mono ${
                scan.scan_engine === 'zap'
                  ? 'bg-blue-950/70 text-blue-300 border-blue-500/40'
                  : 'bg-purple-950/70 text-purple-300 border-purple-500/40'
              }`}>
                {scan.scan_engine === 'zap' ? (
                  <>
                    <Shield className="w-3 h-3" />
                    <span>OWASP ZAP Engine</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3" />
                    <span>Fallback Engine</span>
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <a
                href={scan.target_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-slate-400 hover:text-cyan-400 flex items-center gap-1 truncate max-w-sm sm:max-w-md"
              >
                <span className="truncate">{scan.target_url}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-cyan-500/50 text-cyan-300 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-glow-cyan active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingPdf ? "Generating PDF..." : "Export PDF Report"}</span>
          </button>
        </div>
      </div>

      {/* Summary Score & Meta Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Score Card */}
        <div className="cyber-card p-6 flex items-center justify-around">
          <ScoreGauge score={scan.security_score || 100} size={160} label="Assessment Score" />
          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Status: <strong className="text-white uppercase font-bold">{scan.status}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Ran: <strong className="text-white">{scan.completed_at ? new Date(scan.completed_at).toLocaleDateString() : 'N/A'}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Findings: <strong className="text-cyan-400">{findings.length} Total</strong></span>
            </div>
          </div>
        </div>

        {/* Severity Metrics */}
        <div className="cyber-card p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
              <span>Identified Vulnerabilities Breakdown</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 text-center">
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30">
                <span className="text-[10px] uppercase font-bold text-rose-400 block">Critical</span>
                <span className="text-xl font-black text-white font-mono">{scan.severity_breakdown?.critical || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-orange-950/40 border border-orange-500/30">
                <span className="text-[10px] uppercase font-bold text-orange-400 block">High</span>
                <span className="text-xl font-black text-white font-mono">{scan.severity_breakdown?.high || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30">
                <span className="text-[10px] uppercase font-bold text-amber-400 block">Medium</span>
                <span className="text-xl font-black text-white font-mono">{scan.severity_breakdown?.medium || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/30">
                <span className="text-[10px] uppercase font-bold text-sky-400 block">Low</span>
                <span className="text-xl font-black text-white font-mono">{scan.severity_breakdown?.low || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/80 col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Info</span>
                <span className="text-xl font-black text-white font-mono">{scan.severity_breakdown?.informational || 0}</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-800/80 flex justify-between font-mono">
            <span>Deterministic Penalty Model Active</span>
            <span>{findings.length} Vulnerabilities Persisted</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search finding, OWASP, CWE, or URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="cyber-input w-full pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['all', 'critical', 'high', 'medium', 'low', 'informational'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
                severityFilter === sev
                  ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-glow-cyan'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {sev === 'informational' ? 'info' : sev}
            </button>
          ))}
        </div>
      </div>

      {/* Findings Table */}
      <div className="cyber-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider bg-slate-900/60">
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Finding Name</th>
                <th className="py-3.5 px-4">OWASP Category</th>
                <th className="py-3.5 px-4">Affected URL / Endpoint</th>
                <th className="py-3.5 px-4 text-right">AI Remediation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredFindings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">
                    No vulnerability findings match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredFindings.map((finding) => (
                  <tr key={finding.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-4 px-4">
                      <SeverityBadge severity={finding.severity} size="sm" />
                    </td>
                    <td className="py-4 px-4 font-bold text-white">
                      <div>{finding.vulnerability?.name || "Security Alert"}</div>
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
                    <td className="py-4 px-4 font-mono text-slate-400 text-[11px]">
                      <div className="flex items-center gap-2 group">
                        <span className="truncate max-w-xs">{finding.affected_url}</span>
                        <button
                          onClick={() => handleCopyUrl(finding.id, finding.affected_url)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-cyan-400 transition-opacity"
                          title="Copy affected URL"
                        >
                          {copiedUrlId === finding.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
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
                        <span>{finding.ai_analysis ? "View AI Analysis" : "Analyze with AI"}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Analysis Modal */}
      <AIAnalysisModal
        finding={selectedFinding}
        onClose={() => setSelectedFinding(null)}
        onAnalysisGenerated={handleUpdateFinding}
      />
    </div>
  );
};
