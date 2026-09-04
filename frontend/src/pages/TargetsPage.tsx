import React, { useState, useEffect } from 'react';
import {
  Target as TargetIcon,
  Plus,
  Trash2,
  ScanSearch,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Globe,
  Activity,
  X
} from 'lucide-react';
import api from '../api/client';
import { Target } from '../types';

interface TargetsPageProps {
  onStartScan: (targetId: string) => void;
}

export const TargetsPage: React.FC<TargetsPageProps> = ({ onStartScan }) => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    try {
      const res = await api.get<Target[]>('/targets');
      setTargets(res.data);
    } catch (err) {
      console.error("Failed to load targets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await api.post('/targets', { name, url, description });
      setShowModal(false);
      setName('');
      setUrl('');
      setDescription('');
      fetchTargets();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create target. Verify URL format and authorization.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTarget = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this target and all associated scan history?")) {
      return;
    }
    try {
      await api.delete(`/targets/${id}`);
      setTargets(targets.filter(t => t.id !== id));
    } catch (err) {
      console.error("Failed to delete target:", err);
    }
  };

  const handleFillVulnerableDemo = () => {
    setName("Deliberately Insecure Demo App");
    setUrl("http://localhost:5000");
    setDescription("Local test container for OWASP ZAP and Cyvera vulnerability verification.");
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <TargetIcon className="w-6 h-6 text-cyan-400" />
            <span>Target Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authorized web applications and APIs configured for automated security assessment.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:via-indigo-500 hover:to-cyan-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-glow-purple shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Authorized Target</span>
        </button>
      </div>

      {/* Target Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
          <Activity className="w-6 h-6 text-cyan-400 animate-spin" />
          <span>Retrieving Monitored Assets...</span>
        </div>
      ) : targets.length === 0 ? (
        <div className="cyber-card p-10 sm:p-14 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-950 to-slate-900 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-glow-cyan">
            <TargetIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-white tracking-tight">No Monitored Targets Added Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mt-1 mb-6 leading-relaxed">
            Add an application URL you own or are authorized to test to begin vulnerability assessment and AI remediation.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:via-indigo-500 hover:to-cyan-500 text-white text-xs font-bold uppercase tracking-wider shadow-glow-purple transition-all"
          >
            Add First Target
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {targets.map((target) => (
            <div key={target.id} className="cyber-card p-5 sm:p-6 flex flex-col justify-between hover:border-cyan-500/50 transition-all group">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0" />
                    <h3 className="text-base font-bold text-white truncate">
                      {target.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleDeleteTarget(target.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors shrink-0"
                    title="Delete Target"
                    aria-label="Delete target"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <a
                  href={target.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1.5 truncate"
                >
                  <span className="truncate">{target.url}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>

                {target.description && (
                  <p className="text-xs text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                    {target.description}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Posture</span>
                  {target.latest_score !== null && target.latest_score !== undefined ? (
                    <span className={`text-sm font-black font-mono ${
                      target.latest_score >= 80 ? 'text-emerald-400' : target.latest_score >= 60 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {target.latest_score}/100
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-mono">Unscanned</span>
                  )}
                </div>

                <button
                  onClick={() => onStartScan(target.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-wider transition-all shadow-glow-cyan"
                >
                  <ScanSearch className="w-3.5 h-3.5" />
                  <span>Scan Target</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Target Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="cyber-card max-w-md w-full p-6 border-cyan-500/50 shadow-2xl shadow-cyan-950/60 animate-scale-in">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black text-white tracking-tight">Add Authorized Security Target</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Enter target parameters. SSRF protection policy will automatically validate the target IP.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateTarget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Target Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Production Web Portal"
                  className="cyber-input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Target URL
                </label>
                <input
                  type="text"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://app.example.com"
                  className="cyber-input w-full text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Target scope notes or environment details..."
                  className="cyber-input w-full text-xs h-20 resize-none"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 inline mr-1" />
                By adding this target, you attest that you are authorized to conduct security assessments on this application.
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleFillVulnerableDemo}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2"
                >
                  Fill Demo (localhost:5000)
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700/60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:via-indigo-500 hover:to-cyan-500 text-xs font-bold text-white uppercase tracking-wider transition-all shadow-glow-purple disabled:opacity-50"
                  >
                    {submitting ? "Validating..." : "Save Target"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
