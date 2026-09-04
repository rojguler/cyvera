import React, { useState, useEffect } from 'react';
import { Plus, ShieldCheck, Activity, Menu, DownloadCloud, Sparkles } from 'lucide-react';

interface TopBarProps {
  onStartNewScan: () => void;
  onToggleMobileMenu?: () => void;
  activeScanCount?: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  onStartNewScan,
  onToggleMobileMenu,
  activeScanCount = 0
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <header className="h-16 bg-cyber-900/80 backdrop-blur-md border-b border-purple-950/60 flex items-center justify-between px-4 sm:px-8 z-20 shrink-0 select-none">
      <div className="flex items-center gap-3">
        {/* Mobile menu hamburger button */}
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Engine Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-[0_0_12px_-3px_rgba(16,185,129,0.3)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <ShieldCheck className="w-3.5 h-3.5 hidden sm:inline" />
          <span className="text-[11px] sm:text-xs">Scanner Engine Online</span>
        </div>

        {/* Active Scan Indicator */}
        {activeScanCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-semibold shadow-glow-purple animate-pulse">
            <Activity className="w-3.5 h-3.5" />
            <span>{activeScanCount} Scan in Progress</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* PWA Install Button */}
        {isInstallable && (
          <button
            onClick={handleInstallClick}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/70 hover:bg-purple-900/90 border border-purple-500/40 text-purple-300 text-xs font-bold transition-all shadow-glow-purple"
            title="Install Cyvera PWA to your device"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
        )}

        {/* Quick Launch Scan Button */}
        <button
          onClick={onStartNewScan}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:via-indigo-500 hover:to-cyan-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-glow-purple active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Target Scan</span>
        </button>
      </div>
    </header>
  );
};
