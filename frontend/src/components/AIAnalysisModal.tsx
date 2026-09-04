import React, { useState } from 'react';
import { Sparkles, X, Copy, Check, ShieldAlert, Code2, AlertTriangle } from 'lucide-react';
import { ScanFinding } from '../types';
import { SeverityBadge } from './SeverityBadge';
import api from '../api/client';

interface AIAnalysisModalProps {
  finding: ScanFinding | null;
  onClose: () => void;
  onAnalysisGenerated?: (updatedFinding: ScanFinding) => void;
}

export const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({ finding, onClose, onAnalysisGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'explanation' | 'remediation' | 'code'>('explanation');

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-cyber-900 border border-cyan-500/40 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl shadow-cyan-950/50 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-900/60">
          <div>
            <div className="flex items-center gap-3">
              <SeverityBadge severity={finding.severity} size="md" />
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-[11px] font-semibold text-cyan-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gemini Security Assistant</span>
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mt-2">
              {finding.vulnerability?.name || "Vulnerability Analysis"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono truncate max-w-xl">
              {finding.affected_url}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!ai ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-4 shadow-glow-cyan">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white">Generate AI Threat Context & Remediation</h3>
              <p className="text-xs text-slate-400 max-w-md mt-1 mb-6">
                Cyvera uses Gemini AI to analyze raw scanner evidence, translate the technical impact, and generate developer-friendly fix snippets.
              </p>
              <button
                onClick={handleGenerateAI}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-glow-cyan disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? "Analyzing Finding..." : "Analyze with Gemini AI"}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-800 gap-6 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('explanation')}
                  className={`pb-3 border-b-2 transition-all ${
                    activeTab === 'explanation'
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Technical Explanation & Impact
                </button>
                <button
                  onClick={() => setActiveTab('remediation')}
                  className={`pb-3 border-b-2 transition-all ${
                    activeTab === 'remediation'
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Step-by-Step Remediation
                </button>
                <button
                  onClick={() => setActiveTab('code')}
                  className={`pb-3 border-b-2 transition-all ${
                    activeTab === 'code'
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Code Fix / Configuration
                </button>
              </div>

              {activeTab === 'explanation' && (
                <div className="space-y-4">
                  <div className="cyber-card p-4">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      What is this Vulnerability?
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed">{ai.explanation}</p>
                  </div>

                  <div className="cyber-card p-4 border-amber-500/30 bg-amber-950/20">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Why It Matters & Threat Impact</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{ai.why_it_matters}</p>
                    <div className="mt-3 pt-3 border-t border-amber-500/20 text-xs text-amber-200/80">
                      <strong>Potential Business Impact:</strong> {ai.potential_impact}
                    </div>
                  </div>

                  {ai.evidence_interpretation && (
                    <div className="cyber-card p-4">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Evidence Interpretation
                      </h4>
                      <p className="text-xs font-mono text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-800">
                        {ai.evidence_interpretation}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'remediation' && (
                <div className="space-y-4">
                  <div className="cyber-card p-5">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Developer Remediation Strategy</span>
                    </h4>
                    <div className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                      {ai.remediation}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'code' && (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                        <Code2 className="w-4 h-4 text-cyan-400" />
                        <span>Fix Guidance / Security Patch</span>
                      </div>
                      <button
                        onClick={() => handleCopyCode(ai.fix_guidance)}
                        className="flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-4 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                      {ai.fix_guidance}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <span>Model: {ai?.model_version || "gemini-2.0-flash"}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
