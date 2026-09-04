import React, { useState, useEffect } from 'react';
import { Target as TargetIcon, Plus, Trash2, ScanSearch, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
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
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <TargetIcon className="w-6 h-6 text-cyan-400" />
            <span>Target Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authorized web applications and APIs configured for automated security assessment.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-glow-cyan"
        >
          <Plus className="w-4 h-4" />
          <span>Add Authorized Target</span>
        </button>
      </div>

      {/* Target Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading targets...</div>
      ) : targets.length === 0 ? (
        <div className="cyber-card p-12 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
            <TargetIcon className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">No Monitored Targets Added Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mt-1 mb-6">
            Add an application URL you own or are authorized to test to begin vulnerability assessment and AI remediation.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider"
          >
            Add First Target
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {targets.map((target) => (
            <div key={target.id} className="cyber-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-glow-emerald" />
                    <h3 className="text-base font-bold text-white truncate max-w-[200px]">
                      {target.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleDeleteTarget(target.id)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    title="Delete Target"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <a
                  href={target.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1.5 truncate"
                >
                  <span className="truncate">{target.url}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>

                {target.description && (
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                    {target.description}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Posture</span>
                  {target.latest_score !== null && target.latest_score !== undefined ? (
                    <span className={`text-sm font-extrabold ${
                      target.latest_score >= 80 ? 'text-emerald-400' : target.latest_score >= 60 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {target.latest_score}/100
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 font-medium">Unscanned</span>
                  )}
                </div>

                <button
                  onClick={() => onStartScan(target.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-wider transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="cyber-card max-w-md w-full p-6 border-cyan-500/40 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Add Authorized Security Target</h2>
            <p className="text-xs text-slate-400 mb-4">
              Enter target parameters. SSRF protection policy will automatically validate the target IP.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-start gap-2">
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

              <div className="p-3 rounded bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 inline mr-1" />
                By adding this target, you attest that you are authorized to run security scans on this application.
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleFillVulnerableDemo}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  Fill Demo Container (localhost:5000)
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white uppercase tracking-wider transition-all disabled:opacity-50"
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
