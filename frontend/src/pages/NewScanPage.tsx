import React, { useState, useEffect } from 'react';
import {
  ScanSearch,
  ShieldCheck,
  AlertTriangle,
  Play,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  Zap,
  Globe,
  Radio,
  FileSearch,
  Sparkles
} from 'lucide-react';
import api from '../api/client';
import { Target, Scan } from '../types';

interface NewScanPageProps {
  initialTargetId?: string;
  onScanCompleted: (scanId: string) => void;
}

export const NewScanPage: React.FC<NewScanPageProps> = ({ initialTargetId, onScanCompleted }) => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>(initialTargetId || '');
  const [scanType, setScanType] = useState<'passive' | 'active' | 'full'>('passive');
  const [authorizedConsent, setAuthorizedConsent] = useState(false);
  
  // Scan Execution & Polling State
  const [runningScan, setRunningScan] = useState<Scan | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    try {
      const res = await api.get<Target[]>('/targets');
      setTargets(res.data);
      if (!selectedTargetId && res.data.length > 0) {
        setSelectedTargetId(res.data[0].id);
      }
    } catch (err) {
      console.error("Failed to load targets:", err);
    }
  };

  // Poll scan status while running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScanning && runningScan) {
      interval = setInterval(async () => {
        try {
          const res = await api.get<Scan>(`/scans/${runningScan.id}/status`);
          setRunningScan(res.data);

          if (res.data.status === 'completed') {
            setIsScanning(false);
            clearInterval(interval);
            setTimeout(() => {
              onScanCompleted(res.data.id);
            }, 1000);
          } else if (res.data.status === 'failed' || res.data.status === 'cancelled') {
            setIsScanning(false);
            setError(res.data.error_message || "Scan failed during execution.");
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Error polling scan status:", err);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isScanning, runningScan]);

  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetId) {
      setError("Please select a target application.");
      return;
    }
    if (!authorizedConsent) {
      setError("You must confirm authorization before initiating a scan.");
      return;
    }

    setError(null);
    setIsScanning(true);

    try {
      const res = await api.post<Scan>('/scans', {
        target_id: selectedTargetId,
        scan_type: scanType,
        authorized_confirmation: true
      });
      setRunningScan(res.data);
    } catch (err: any) {
      setIsScanning(false);
      setError(err.response?.data?.detail || "Failed to start scan.");
    }
  };

  const getStageName = (progress: number) => {
    if (progress < 25) return "Validating Scope & SSRF IP Guard Verification...";
    if (progress < 50) return "Running Web Spider & Crawling Endpoints...";
    if (progress < 75) return "Executing Active/Passive Vulnerability Rules...";
    if (progress < 90) return "Normalizing Alert Records & Calculating Score...";
    if (progress < 100) return "Synthesizing Gemini AI Context & Threat Insights...";
    return "Assessment Completed Successfully!";
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <ScanSearch className="w-6 h-6 text-cyan-400" />
          <span>Launch Security Scan</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure scan profile and execute automated vulnerability assessment against authorized targets.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5 shadow-[0_0_15px_-3px_rgba(244,63,94,0.3)] animate-shake">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form or Live Progress Card */}
      {!isScanning && (!runningScan || runningScan.status !== 'running') ? (
        <form onSubmit={handleStartScan} className="space-y-6">
          
          {/* Target Selection */}
          <div className="cyber-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>1. Select Target Application</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                {targets.length} Available Target(s)
              </span>
            </div>
            
            {targets.length === 0 ? (
              <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 text-center">
                No targets found. Please add an authorized target in the Targets page first.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {targets.map((t) => {
                  const isSelected = selectedTargetId === t.id;
                  return (
                    <label
                      key={t.id}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900/80 border-cyan-500/80 text-white shadow-glow-cyan'
                          : 'bg-slate-900/50 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-850/50'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <input
                          type="radio"
                          name="target"
                          value={t.id}
                          checked={isSelected}
                          onChange={() => setSelectedTargetId(t.id)}
                          className="w-4 h-4 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                        />
                        <div>
                          <span className="text-sm font-bold block">{t.name}</span>
                          <span className="text-xs font-mono text-cyan-400/90">{t.url}</span>
                        </div>
                      </div>

                      {t.latest_score !== null && t.latest_score !== undefined ? (
                        <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                          t.latest_score >= 80
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                            : t.latest_score >= 60
                            ? 'bg-amber-950/60 text-amber-400 border-amber-500/30'
                            : 'bg-rose-950/60 text-rose-400 border-rose-500/30'
                        }`}>
                          Score: {t.latest_score}/100
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-500">Unscanned</span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Scan Profile Selection */}
          <div className="cyber-card p-5 sm:p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>2. Choose Assessment Profile</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                onClick={() => setScanType('passive')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  scanType === 'passive'
                    ? 'bg-gradient-to-b from-cyan-950/80 to-slate-900/80 border-cyan-500 text-white shadow-glow-cyan'
                    : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    Passive Inspection
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    Safe
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Safe, non-destructive inspection. Analyzes headers, cookies, CSP, information leaks and spidered routes.
                </p>
              </div>

              <div
                onClick={() => setScanType('active')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  scanType === 'active'
                    ? 'bg-gradient-to-b from-cyan-950/80 to-slate-900/80 border-cyan-500 text-white shadow-glow-cyan'
                    : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                    Active Fuzzing
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-500/30">
                    Intrusive
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sends attack payloads for Reflected XSS, SQL Injection, and input parameter vulnerabilities.
                </p>
              </div>

              <div
                onClick={() => setScanType('full')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  scanType === 'full'
                    ? 'bg-gradient-to-b from-cyan-950/80 to-slate-900/80 border-cyan-500 text-white shadow-glow-cyan'
                    : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    Full Suite + AI
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                    Deep
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Full spider crawl + deep active scanning + automatic AI remediation synthesis.
                </p>
              </div>
            </div>
          </div>

          {/* Authorization Attestation Checkbox */}
          <div className="cyber-card p-5 border-cyan-500/40 bg-gradient-to-r from-cyan-950/30 to-slate-900/60">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={authorizedConsent}
                onChange={(e) => setAuthorizedConsent(e.target.checked)}
                className="mt-1 w-4 h-4 text-cyan-500 rounded focus:ring-cyan-400 cursor-pointer"
              />
              <div className="text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-white block mb-0.5">
                  Explicit Authorization & Scope Attestation (Required)
                </span>
                I confirm that I am the owner of the target system or possess explicit authorization from the system owner to conduct automated security assessments against this target.
              </div>
            </label>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={!selectedTargetId || !authorizedConsent}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-glow-cyan flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Execute Security Assessment</span>
          </button>
        </form>
      ) : (
        /* Real-time Scan Progress UI */
        <div className="cyber-card p-6 sm:p-10 text-center space-y-6">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-2xl bg-cyan-500/20 blur-xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-2xl bg-cyan-950 border border-cyan-500/60 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Security Assessment in Progress</h2>
            <p className="text-xs text-cyan-400 mt-1 font-semibold font-mono">
              {getStageName(runningScan?.progress || 10)}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto space-y-2">
            <div className="w-full bg-slate-900 rounded-full h-3 border border-slate-800 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-cyan-500 via-sky-400 to-cyan-300 h-full rounded-full transition-all duration-500 shadow-glow-cyan"
                style={{ width: `${runningScan?.progress || 10}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>Execution State</span>
              <span className="text-cyan-400 font-bold">{runningScan?.progress || 10}%</span>
            </div>
          </div>

          {/* Live Stage Checklist */}
          <div className="max-w-md mx-auto text-left space-y-3 pt-5 border-t border-slate-800/80">
            <div className="flex items-center gap-3 text-xs">
              {(runningScan?.progress || 0) >= 25 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
              )}
              <span className={(runningScan?.progress || 0) >= 25 ? "text-slate-200 font-semibold" : "text-slate-400"}>
                DNS Resolution & SSRF Policy Validation
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              {(runningScan?.progress || 0) >= 50 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (runningScan?.progress || 0) >= 25 ? (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
              )}
              <span className={(runningScan?.progress || 0) >= 50 ? "text-slate-200 font-semibold" : "text-slate-400"}>
                OWASP ZAP Spider & Route Discovery
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              {(runningScan?.progress || 0) >= 75 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (runningScan?.progress || 0) >= 50 ? (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
              )}
              <span className={(runningScan?.progress || 0) >= 75 ? "text-slate-200 font-semibold" : "text-slate-400"}>
                Active/Passive Alert Extraction & Scoring
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              {(runningScan?.progress || 0) >= 95 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (runningScan?.progress || 0) >= 75 ? (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
              )}
              <span className={(runningScan?.progress || 0) >= 95 ? "text-slate-200 font-semibold" : "text-slate-400"}>
                Gemini AI Remediation Synthesis
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
