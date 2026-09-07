import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, ExternalLink, Activity, ShieldCheck } from 'lucide-react';
import api from '../api/client';
import { Scan } from '../types';
import { FALLBACK_SCANS } from '../utils/fallbackData';

interface ReportsPageProps {
  onOpenScan: (scanId: string) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ onOpenScan }) => {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async () => {
    try {
      const res = await api.get<Scan[]>('/scans', { params: { status: 'completed' } });
      setScans(res.data);
    } catch (err) {
      console.warn("Backend API not reachable, loading reports fallback.");
      setScans(FALLBACK_SCANS);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (scanId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadingId(scanId);
    try {
      const response = await api.get(`/reports/scans/${scanId}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Cyvera_Assessment_${scanId.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <FileText className="w-6 h-6 text-cyan-400" />
          <span>Security Assessment Reports</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Exportable executive assessment summaries with OWASP Top 10 breakdown and AI-driven remediation roadmaps.
        </p>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
          <Activity className="w-6 h-6 text-cyan-400 animate-spin" />
          <span className="font-mono">Compiling Report Catalog...</span>
        </div>
      ) : scans.length === 0 ? (
        <div className="cyber-card p-12 text-center text-xs text-slate-500">
          No completed scans available yet. Run a scan on any target to generate an assessment report.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {scans.map((scan) => (
            <div
              key={scan.id}
              onClick={() => onOpenScan(scan.id)}
              className="cyber-card p-5 sm:p-6 cursor-pointer flex flex-col justify-between hover:border-cyan-500/60 hover:translate-y-[-2px] transition-all group shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-mono">
                      PDF Document
                    </span>
                    <h3 className="text-base font-bold text-white mt-2 group-hover:text-cyan-300 transition-colors truncate max-w-[200px]">
                      {scan.target_name}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Score</span>
                    <span className={`text-base font-black font-mono ${
                      (scan.security_score || 0) >= 80 ? 'text-emerald-400' : (scan.security_score || 0) >= 60 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {scan.security_score || 100}/100
                    </span>
                  </div>
                </div>

                <p className="text-xs font-mono text-slate-400 mt-2 truncate">
                  {scan.target_url}
                </p>

                <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Critical / High:</span>
                    <span className="font-bold text-rose-400">
                      {(scan.severity_breakdown?.critical || 0) + (scan.severity_breakdown?.high || 0)} findings
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Vulnerabilities:</span>
                    <span className="font-bold text-white">{scan.severity_breakdown?.total || 0}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(scan.created_at).toLocaleDateString()}</span>
                </div>

                <button
                  onClick={(e) => handleDownloadPdf(scan.id, e)}
                  disabled={downloadingId === scan.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-glow-cyan active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloadingId === scan.id ? "PDF..." : "Download PDF"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
