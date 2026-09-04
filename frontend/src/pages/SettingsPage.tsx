import React from 'react';
import { Settings, ShieldCheck, Sparkles, Server, Key, Lock, CheckCircle2, Cpu, ShieldAlert, Layers } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-slate-400" />
          <span>Platform Settings & Engine Health</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review scanner daemon connectivity, Gemini AI configuration, and scoring parameters.
        </p>
      </div>

      {/* Account Profile */}
      <div className="cyber-card p-5 sm:p-6 space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Lock className="w-4 h-4 text-cyan-400" />
          <span>SecOps Account Profile</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block uppercase font-bold text-[10px]">Username</span>
            <span className="text-white font-semibold text-sm">{user?.username}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block uppercase font-bold text-[10px]">Email Address</span>
            <span className="text-white font-semibold text-sm">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Connected Integrations & Services */}
      <div className="cyber-card p-5 sm:p-6 space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-400" />
          <span>Service Integrations</span>
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-900/70 border border-slate-800 gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-glow-cyan shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white block text-sm">OWASP ZAP Engine</span>
                <span className="text-slate-400 text-xs">Core Automated Scanner Daemon</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-xs px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 self-start sm:self-auto font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Daemon / Fallback Active</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-900/70 border border-slate-800 gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-glow-purple shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white block text-sm">Google Gemini AI</span>
                <span className="text-slate-400 text-xs">Automated Threat Context & Fix Snippets</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-cyan-400 font-semibold text-xs px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 self-start sm:self-auto font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>gemini-2.0-flash</span>
            </span>
          </div>
        </div>
      </div>

      {/* Deterministic Scoring Engine Policy */}
      <div className="cyber-card p-5 sm:p-6 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Deterministic Scoring Formula Specification</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          Cyvera computes scores through deterministic mathematical formulas with diminishing returns caps. The AI layer never fabricates or assigns numerical scores.
        </p>

        <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 font-mono text-xs text-slate-300 space-y-1.5">
          <div className="text-cyan-400 font-bold">Base Posture Score = 100</div>
          <div>• Critical Penalty: -25 pts (Tier Maximum Cap: -45 pts)</div>
          <div>• High Penalty:     -15 pts (Tier Maximum Cap: -35 pts)</div>
          <div>• Medium Penalty:   -8 pts  (Tier Maximum Cap: -25 pts)</div>
          <div>• Low Penalty:      -3 pts  (Tier Maximum Cap: -12 pts)</div>
          <div>• Info Penalty:     -0.5 pt (Tier Maximum Cap: -3 pts)</div>
          <div className="text-emerald-400 pt-1.5 font-bold">Final Score = max(0, 100 - sum(Capped_Tier_Penalties))</div>
        </div>
      </div>

      {/* SSRF Security Guard Policy */}
      <div className="cyber-card p-5 sm:p-6 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-orange-400" />
          <span>SSRF Guard Protection Policy</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          Before any target URL is forwarded to the scanning engine or OWASP ZAP, it resolves through DNS validation to ensure it does not target private RFC 1918 subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), cloud metadata services (169.254.169.254), or internal loopbacks unless explicitly enabled in developer testing mode.
        </p>
      </div>

    </div>
  );
};
