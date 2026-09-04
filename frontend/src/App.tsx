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
import { Activity } from 'lucide-react';

export const App: React.FC = () => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [selectedTargetForScan, setSelectedTargetForScan] = useState<string | undefined>(undefined);

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cyber-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Initializing Cyvera SecOps Console...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleNavigate = (tab: string, scanId?: string) => {
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
  };

  const handleScanCompleted = (scanId: string) => {
    setSelectedScanId(scanId);
    setCurrentTab('scan-detail');
  };

  return (
    <div className="min-h-screen flex bg-cyber-950 text-slate-100 antialiased overflow-hidden">
      {/* Navigation Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={handleNavigate} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar
          onStartNewScan={() => {
            setSelectedTargetForScan(undefined);
            setCurrentTab('new-scan');
          }}
        />

        <main className="flex-1 overflow-y-auto bg-cyber-950/80">
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
