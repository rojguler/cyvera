import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/LoginPage';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardPage } from './pages/DashboardPage';
import { TargetsPage } from './pages/TargetsPage';
import { NewScanPage } from './pages/NewScanPage';
import { ScanDetailsPage } from './pages/ScanDetailsPage';
import { VulnerabilitiesPage } from './pages/VulnerabilitiesPage';
import { ScanHistoryPage } from './pages/ScanHistoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { Activity, ShieldAlert } from 'lucide-react';

export const App: React.FC = () => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [selectedTargetForScan, setSelectedTargetForScan] = useState<string | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050811] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-glow-cyan animate-pulse">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400 animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
              Initializing Cyvera SecOps Console...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleNavigate = (tab: string, scanId?: string) => {
    setIsMobileMenuOpen(false);
    if (tab === 'scan-detail' && scanId) {
      setSelectedScanId(scanId);
      setCurrentTab('scan-detail');
    } else {
      setSelectedScanId(null);
      setCurrentTab(tab);
    }
  };

  const handleStartScanFromTarget = (targetId: string) => {
    setSelectedTargetForScan(targetId);
    setCurrentTab('new-scan');
    setIsMobileMenuOpen(false);
  };

  const handleScanCompleted = (scanId: string) => {
    setSelectedScanId(scanId);
    setCurrentTab('scan-detail');
  };

  return (
    <div className="min-h-screen flex bg-[#050811] text-slate-100 antialiased overflow-hidden selection:bg-cyan-500 selection:text-white">
      {/* Navigation Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={handleNavigate}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar
          onStartNewScan={() => {
            setSelectedTargetForScan(undefined);
            setCurrentTab('new-scan');
          }}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#050811] to-[#080d1a] cyber-bg-grid">
          {currentTab === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
          {currentTab === 'targets' && <TargetsPage onStartScan={handleStartScanFromTarget} />}
          {currentTab === 'new-scan' && (
            <NewScanPage
              initialTargetId={selectedTargetForScan}
              onScanCompleted={handleScanCompleted}
            />
          )}
          {currentTab === 'scan-detail' && selectedScanId && (
            <ScanDetailsPage
              scanId={selectedScanId}
              onBack={() => setCurrentTab('dashboard')}
            />
          )}
          {currentTab === 'vulnerabilities' && <VulnerabilitiesPage />}
          {currentTab === 'history' && <ScanHistoryPage onOpenScan={(id) => handleNavigate('scan-detail', id)} />}
          {currentTab === 'reports' && <ReportsPage onOpenScan={(id) => handleNavigate('scan-detail', id)} />}
          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
};

export default App;
