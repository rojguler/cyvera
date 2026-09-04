import React from 'react';
import { Settings, ShieldCheck, Sparkles, Server, Key, Lock, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-slate-400" />
          <span>Platform Settings & Engine Health</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review scanner daemon connectivity, Gemini AI configuration, and scoring parameters.
        </p>
      </div>

      {/* Account Profile */}
      <div className="cyber-card p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Lock className="w-4 h-4 text-cyan-400" />
          <span>SecOps Account Profile</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded bg-slate-900 border border-slate-800">
            <span className="text-slate-500 block uppercase font-bold text-[10px]">Username</span>
            <span className="text-white font-semibold">{user?.username}</span>
          </div>
          <div className="p-3 rounded bg-slate-900 border border-slate-800">
            <span className="text-slate-500 block uppercase font-bold text-[10px]">Email</span>
            <span className="text-white font-semibold">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Connected Integrations & Services */}
      <div className="cyber-card p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-400" />
          <span>Service Integrations</span>
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded bg-slate-900/70 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">OWASP ZAP Engine</span>
                <span className="text-slate-400 text-[11px]">Core Automated Scanner Service</span>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px] px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Connected / Fallback Active</span>
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded bg-slate-900/70 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">Google Gemini API</span>
                <span className="text-slate-400 text-[11px]">Structured JSON Vulnerability Remediation</span>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-cyan-400 font-semibold text-[11px] px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>gemini-2.0-flash</span>
            </span>
          </div>
        </div>
      </div>

      {/* Deterministic Scoring Engine Policy */}
      <div className="cyber-card p-6 space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Deterministic Scoring Formula Specification
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Cyvera uses a deterministic mathematical penalty model with diminishing returns caps. The AI assistant never assigns or modifies the score.
        </p>

        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-1.5">
          <div className="text-cyan-400">Base Score = 100</div>
          <div>• Critical Penalty: -25 pts (Tier Maximum Cap: -45 pts)</div>
          <div>• High Penalty:     -15 pts (Tier Maximum Cap: -35 pts)</div>
          <div>• Medium Penalty:   -8 pts  (Tier Maximum Cap: -25 pts)</div>
          <div>• Low Penalty:      -3 pts  (Tier Maximum Cap: -12 pts)</div>
          <div>• Info Penalty:     -0.5 pt (Tier Maximum Cap: -3 pts)</div>
          <div className="text-emerald-400 pt-1">Final Score = max(0, 100 - sum(Capped_Tier_Penalties))</div>
        </div>
      </div>

      {/* SSRF Security Guard Policy */}
      <div className="cyber-card p-6 space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          SSRF Guard Protection Policy
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Before any target URL is passed to OWASP ZAP or the scanning engine, it resolves against DNS to verify that it does not target private RFC 1918 subnets, cloud metadata APIs (169.254.169.254), or unauthorized internal services.
        </p>
      </div>

    </div>
  );
};
