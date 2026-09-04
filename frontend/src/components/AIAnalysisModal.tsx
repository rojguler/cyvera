import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Copy,
  Check,
  ShieldAlert,
  Code2,
  AlertTriangle,
  FileCode2,
  Layers,
  Cpu,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { ScanFinding } from '../types';
import { SeverityBadge } from './SeverityBadge';
import api from '../api/client';

interface AIAnalysisModalProps {
  finding: ScanFinding | null;
  onClose: () => void;
  onAnalysisGenerated?: (updatedFinding: ScanFinding) => void;
}

export const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({
  finding,
  onClose,
  onAnalysisGenerated
}) => {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'explanation' | 'remediation' | 'code'>('explanation');

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!finding) return null;

  const ai = finding.ai_analysis;

  const handleGenerateAI = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/ai/analyze/${finding.id}`);
      if (onAnalysisGenerated) {
        onAnalysisGenerated({
          ...finding,
          ai_analysis: res.data
        });
      }
    } catch (err) {
      console.error("AI Generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="cyber-card max-w-3xl w-full max-h-[90vh] flex flex-col border-cyan-500/50 shadow-2xl shadow-cyan-950/60 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800/90 flex items-start justify-between bg-gradient-to-r from-slate-900/90 to-cyber-900/90">
          <div className="space-y-1.5 pr-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <SeverityBadge severity={finding.severity} size="md" />
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[11px] font-bold text-cyan-300 shadow-glow-cyan">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Gemini SecOps Assistant</span>
              </div>
              {finding.vulnerability?.owasp_category && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
                  {finding.vulnerability.owasp_category}
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {finding.vulnerability?.name || "Vulnerability Technical Analysis"}
            </h2>

            <p className="text-xs text-slate-400 font-mono truncate max-w-xl">
              Target: <span className="text-cyan-400">{finding.affected_url}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {!ai ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-950 to-slate-900 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-4 shadow-glow-cyan">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-white tracking-tight">
                Synthesize Threat Context & Fix Snippets
              </h3>
              <p className="text-xs text-slate-400 max-w-md mt-1 mb-6 leading-relaxed">
                Cyvera leverages Google Gemini AI to analyze raw HTTP attack evidence, assess technical business impact, and generate remediation code tailored to this vulnerability.
              </p>
              <button
                onClick={handleGenerateAI}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-glow-cyan disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? "Analyzing Finding Evidence..." : "Analyze with Gemini AI"}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Tab Navigation */}
              <div className="flex border-b border-slate-800/80 gap-4 sm:gap-6 text-xs font-semibold overflow-x-auto pb-0.5">
                <button
                  onClick={() => setActiveTab('explanation')}
                  className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'explanation'
                      ? 'border-cyan-400 text-cyan-400 font-bold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Technical Threat Context</span>
                </button>

                <button
                  onClick={() => setActiveTab('remediation')}
                  className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'remediation'
                      ? 'border-cyan-400 text-cyan-400 font-bold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Step-by-Step Remediation</span>
                </button>

                <button
                  onClick={() => setActiveTab('code')}
                  className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'code'
                      ? 'border-cyan-400 text-cyan-400 font-bold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Code Fix Snippet</span>
                </button>
              </div>

              {/* Tab: Explanation */}
              {activeTab === 'explanation' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="cyber-card p-4 sm:p-5">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      <span>Vulnerability Breakdown</span>
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed font-sans">{ai.explanation}</p>
                  </div>

                  <div className="cyber-card p-4 sm:p-5 border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-slate-900/60">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Why It Matters & Threat Impact</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{ai.why_it_matters}</p>
                    <div className="mt-3 pt-3 border-t border-amber-500/20 text-xs text-amber-200/90 font-medium">
                      <strong>Potential Business Impact:</strong> {ai.potential_impact}
                    </div>
                  </div>

                  {ai.evidence_interpretation && (
                    <div className="cyber-card p-4 sm:p-5">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <FileCode2 className="w-4 h-4 text-cyan-400" />
                        <span>Scanner Evidence Interpretation</span>
                      </h4>
                      <div className="text-xs font-mono text-cyan-300/90 bg-slate-950 p-3 rounded-lg border border-slate-800/80 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                        {ai.evidence_interpretation}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Remediation */}
              {activeTab === 'remediation' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="cyber-card p-5">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Developer Remediation Strategy</span>
                    </h4>
                    <div className="text-sm text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                      {ai.remediation}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Code */}
              {activeTab === 'code' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="relative rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-lg">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
                      <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                        <Code2 className="w-4 h-4 text-cyan-400" />
                        <span>Security Patch / Configuration Fix</span>
                      </div>
                      <button
                        onClick={() => handleCopyCode(ai.fix_guidance)}
                        className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 hover:border-cyan-500/40 transition-all"
                        aria-label="Copy code to clipboard"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-4 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed bg-slate-950/90 selection:bg-cyan-500 selection:text-white">
                      {ai.fix_guidance}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/70 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Model: {ai?.model_version || "gemini-2.0-flash"}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700/60 hover:border-slate-600 transition-all"
          >
            Close Analyst View
          </button>
        </div>
      </div>
    </div>
  );
};
