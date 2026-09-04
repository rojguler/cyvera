import React, { useState } from 'react';
import { ShieldAlert, Lock, Mail, User as UserIcon, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { AuthResponse, User } from '../types';

export const LoginPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        // Register flow
        await api.post('/auth/register', {
          email,
          username,
          password
        });
        // Auto login after register
        const res = await api.post<AuthResponse>('/auth/login', {
          username_or_email: email,
          password
        });
        const userRes = await api.get<User>('/auth/me', {
          headers: { Authorization: `Bearer ${res.data.access_token}` }
        });
        login(res.data.access_token, res.data.refresh_token, userRes.data);
      } else {
        // Login flow
        const res = await api.post<AuthResponse>('/auth/login', {
          username_or_email: email || username,
          password
        });
        const userRes = await api.get<User>('/auth/me', {
          headers: { Authorization: `Bearer ${res.data.access_token}` }
        });
        login(res.data.access_token, res.data.refresh_token, userRes.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('demo@cyvera.io');
    setUsername('secops_demo');
    setPassword('CyveraSecurity2025!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-950 p-6 relative overflow-hidden">
      {/* Background Decorative Grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2d4a15_1px,transparent_1px),linear-gradient(to_bottom,#1f2d4a15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="cyber-card max-w-md w-full p-8 relative z-10 border-cyan-500/30 shadow-2xl">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 mx-auto mb-4 shadow-glow-cyan">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white">CYVERA</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-widest">
            AI-Powered Web Security Scanner
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-950/50 border border-red-500/40 text-red-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="secops_analyst"
                  className="cyber-input w-full pl-10 text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              {isRegister ? "Email Address" : "Email or Username"}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type={isRegister ? "email" : "text"}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@cyvera.io"
                className="cyber-input w-full pl-10 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="cyber-input w-full pl-10 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-glow-cyan flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? "Authenticating..." : isRegister ? "Create SecOps Account" : "Access Scanner"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={handleFillDemo}
            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium py-1 px-2.5 rounded border border-cyan-500/20 bg-cyan-950/30 hover:bg-cyan-950/60 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fill Demo Credentials (1-Click)</span>
          </button>

          <p className="text-xs text-slate-500 mt-4">
            {isRegister ? "Already have an account?" : "Need a new security workspace?"}{' '}
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-cyan-400 hover:underline font-semibold ml-1"
            >
              {isRegister ? "Sign In" : "Register"}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};
