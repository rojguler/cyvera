import React, { useState, useEffect } from 'react';
import { ScanSearch, ShieldCheck, AlertTriangle, Play, Loader2, CheckCircle2, XCircle } from 'lucide-react';
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
            }, 1200);
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
    if (progress < 25) return "Initializing Scanner & Validating Scope...";
    if (progress < 50) return "Executing Spider & Crawling Endpoints...";
    if (progress < 75) return "Running Active/Passive Vulnerability Rules...";
    if (progress < 90) return "Normalizing Alert Records & Calculating Score...";
    if (progress < 100) return "Synthesizing AI Context & Threat Insights...";
    return "Assessment Completed Successfully!";
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <ScanSearch className="w-6 h-6 text-cyan-400" />
          <span>Launch Security Scan</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure scan profile and execute automated vulnerability assessment against authorized targets.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form or Live Progress Card */}
      {!isScanning && (!runningScan || runningScan.status !== 'running') ? (
        <form onSubmit={handleStartScan} className="space-y-6">
          
          {/* Target Selection */}
          <div className="cyber-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              1. Select Target Application
            </h3>
            
            {targets.length === 0 ? (
              <div className="p-4 rounded bg-slate-900 border border-slate-800 text-xs text-slate-400">
                No targets found. Please add a target in the Targets page first.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {targets.map((t) => (
                  <label
                    key={t.id}
                    className={`flex items-center justify-between p-3.5 rounded-lg border cursor-pointer transition-all ${
                      selectedTargetId === t.id
                        ? 'bg-cyan-950/60 border-cyan-500/60 text-white shadow-glow-cyan'
                        : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="target"
                        value={t.id}
                        checked={selectedTargetId === t.id}
                        onChange={() => setSelectedTargetId(t.id)}
                        className="text-cyan-500 focus:ring-cyan-400"
                      />
                      <div>
                        <span className="text-sm font-bold block">{t.name}</span>
                        <span className="text-xs font-mono text-cyan-400/80">{t.url}</span>
                      </div>
                    </div>

                    {t.latest_score !== null && t.latest_score !== undefined && (
                      <span className="text-xs font-bold px-2 py-1 rounded bg-slate-800 text-slate-300">
                        Score: {t.latest_score}/100
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Scan Profile Selection */}
          <div className="cyber-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              2. Choose Scan Profile
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                onClick={() => setScanType('passive')}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  scanType === 'passive'
                    ? 'bg-cyan-950/70 border-cyan-500 text-white shadow-glow-cyan'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                  Passive Scan (Standard)
                </span>
                <p className="text-xs text-slate-300 mt-1">
                  Safe, non-destructive inspection. Analyzes headers, cookies, CSP, information leaks and spidered routes.
                </p>
              </div>

              <div
                onClick={() => setScanType('active')}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  scanType === 'active'
                    ? 'bg-cyan-950/70 border-cyan-500 text-white shadow-glow-cyan'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400 block mb-1">
                  Active Attack Testing
                </span>
                <p className="text-xs text-slate-300 mt-1">
                  Sends test attack payloads for Reflected XSS, SQL Injection, and input parameter vulnerabilities.
                </p>
              </div>

              <div
                onClick={() => setScanType('full')}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  scanType === 'full'
                    ? 'bg-cyan-950/70 border-cyan-500 text-white shadow-glow-cyan'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400 block mb-1">
                  Comprehensive Suite
                </span>
                <p className="text-xs text-slate-300 mt-1">
                  Full spider crawl + deep active scanning + automatic AI remediation synthesis.
                </p>
              </div>
            </div>
          </div>

          {/* Authorization Attestation Checkbox */}
          <div className="cyber-card p-5 border-cyan-500/30 bg-cyan-950/20">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={authorizedConsent}
                onChange={(e) => setAuthorizedConsent(e.target.checked)}
                className="mt-1 w-4 h-4 text-cyan-500 rounded focus:ring-cyan-400 cursor-pointer"
              />
              <div className="text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-white block mb-0.5">
                  Explicit Authorization Confirmation (Required)
                </span>
                I confirm that I am the owner of the target system or have explicit written permission from the system owner to conduct automated security assessments against this target.
              </div>
            </label>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={!selectedTargetId || !authorizedConsent}
            className="w-full py-3.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-glow-cyan flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start Security Assessment</span>
          </button>
        </form>
      ) : (
        /* Real-time Scan Progress UI */
        <div className="cyber-card p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 mx-auto shadow-glow-cyan animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">Security Assessment in Progress</h2>
            <p className="text-xs text-cyan-400 mt-1 font-semibold">
              {getStageName(runningScan?.progress || 10)}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto space-y-2">
            <div className="w-full bg-slate-900 rounded-full h-3 border border-slate-800 overflow-hidden">
              <div
                className="bg-cyan-500 h-full rounded-full transition-all duration-500 shadow-glow-cyan"
                style={{ width: `${runningScan?.progress || 10}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>Progress</span>
              <span>{runningScan?.progress || 10}%</span>
            </div>
          </div>

          {/* Live Stage Checklist */}
          <div className="max-w-md mx-auto text-left space-y-2.5 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs">
              {(runningScan?.progress || 0) >= 25 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              )}
              <span className={(runningScan?.progress || 0) >= 25 ? "text-slate-300" : "text-slate-500"}>
                Target DNS & SSRF Validation
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {(runningScan?.progress || 0) >= 50 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-700" />
              )}
              <span className={(runningScan?.progress || 0) >= 50 ? "text-slate-300" : "text-slate-500"}>
                OWASP ZAP Spider & Endpoint Discovery
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {(runningScan?.progress || 0) >= 75 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-700" />
              )}
              <span className={(runningScan?.progress || 0) >= 75 ? "text-slate-300" : "text-slate-500"}>
                Vulnerability Alert Extraction & Scoring
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {(runningScan?.progress || 0) >= 95 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-700" />
              )}
              <span className={(runningScan?.progress || 0) >= 95 ? "text-slate-300" : "text-slate-500"}>
                Gemini AI Remediation Synthesis
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
