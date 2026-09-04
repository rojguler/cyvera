import React from 'react';
import {
  ShieldAlert,
  LayoutDashboard,
  Target,
  ScanSearch,
  Bug,
  History,
  FileText,
  Settings,
  LogOut,
  X,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const { user, logout } = useAuthStore();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'targets', label: 'Targets', icon: Target },
    { id: 'new-scan', label: 'New Scan', icon: ScanSearch },
    { id: 'vulnerabilities', label: 'Vulnerabilities', icon: Bug },
    { id: 'history', label: 'Scan History', icon: History },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    setCurrentTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-cyber-900/95 border-r border-purple-950/60 flex flex-col justify-between shrink-0 select-none transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-purple-950/60 bg-cyber-950/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 border border-purple-500/50 flex items-center justify-center text-purple-300 shadow-glow-purple">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-wider text-white">CYVERA</span>
                  <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    AI
                  </span>
                </div>
                <p className="text-[10px] text-purple-300/60 tracking-tight font-medium">SecOps Scanner</p>
              </div>
            </div>

            {/* Mobile close button */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Close Sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="p-3.5 space-y-1.5">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all relative ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-950/90 via-slate-900/80 to-slate-900/50 text-purple-200 border border-purple-500/45 shadow-glow-purple'
                      : 'text-slate-400 hover:text-purple-200 hover:bg-purple-950/20 border border-transparent'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-purple-400 to-indigo-400 rounded-r shadow-glow-purple" />
                  )}
                  <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Profile & Logout */}
        <div className="p-3.5 border-t border-purple-950/60 bg-cyber-950/40">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/70 border border-purple-900/30">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-900 border border-purple-500/40 flex items-center justify-center text-xs font-bold text-purple-300 shadow-sm shrink-0">
                {user?.username?.slice(0, 2).toUpperCase() || 'OP'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.username || 'SecOps Analyst'}</p>
                <p className="text-[10px] text-slate-400 truncate font-mono">{user?.email || 'analyst@cyvera.io'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-md border border-transparent hover:border-rose-500/30 transition-all shrink-0 ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
