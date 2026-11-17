'use client';

// CallRoute Console - 100% Dynamic SaaS Dashboard
import { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavTabId } from '@/components/layout/Sidebar';
import { TopNavbar, EnvironmentMode } from '@/components/layout/TopNavbar';
import { ToastContainer, ToastMessage } from '@/components/ui/Toast';
import { OverviewPage } from '@/components/pages/OverviewPage';
import { RoutingRulesPage } from '@/components/pages/RoutingRulesPage';
import { SimulatorPage } from '@/components/pages/SimulatorPage';
import { CallLogsPage } from '@/components/pages/CallLogsPage';
import { IntegrationSettingsPage } from '@/components/pages/IntegrationSettingsPage';
import { HelpGuidePage } from '@/components/pages/HelpGuidePage';
import { RoutingRule, FallbackSettings, CallLogEntry } from '@/types/telephony';

export default function CallRouteConsole() {
  // Navigation & Theme
  const [activeTab, setActiveTab] = useState<NavTabId>('overview');
  const [environment, setEnvironment] = useState<EnvironmentMode>('demo');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Dynamic Live State (Populated via real backend endpoints)
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [fallbackSettings, setFallbackSettings] = useState<FallbackSettings>({
    fallbackNumber: '+15559990000',
    fallbackAgentName: 'National Overflow Center',
    ringTimeoutSeconds: 25,
    sayMessage: 'Please hold while we connect you to our national backup desk.',
    voicemailEnabled: true,
  });
  const [calls, setCalls] = useState<CallLogEntry[]>([]);
  const [selectedCall, setSelectedCall] = useState<CallLogEntry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Apply dark mode class to html document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Toast Helpers
  const showToast = useCallback((type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      title,
      description,
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync Live Data from Backend APIs
  const fetchLiveRules = useCallback(async () => {
    try {
      const res = await fetch('/api/routes');
      if (res.ok) {
        const data = await res.json();
        if (data.routes) setRules(data.routes);
        if (data.fallbackSettings) setFallbackSettings(data.fallbackSettings);
      }
    } catch (e) {
      console.error('Failed to sync live rules:', e);
    }
  }, []);

  const fetchLiveCalls = useCallback(async () => {
    try {
      const res = await fetch('/api/calls');
      if (res.ok) {
        const data = await res.json();
        if (data.calls) setCalls(data.calls);
      }
    } catch (e) {
      console.error('Failed to sync live calls:', e);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchLiveRules(), fetchLiveCalls()]).finally(() => {
      setIsLoading(false);
    });

    // Real-time polling for incoming calls every 3 seconds
    const interval = setInterval(fetchLiveCalls, 3000);
    return () => clearInterval(interval);
  }, [fetchLiveRules, fetchLiveCalls]);

  // Rule Handlers with real API Persistence
  const handleSaveRule = async (rule: RoutingRule) => {
    setRules((prev) => {
      const exists = prev.some((r) => r.id === rule.id);
      return exists ? prev.map((r) => (r.id === rule.id ? rule : r)) : [rule, ...prev];
    });

    try {
      await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule }),
      });
    } catch (e) {
      console.error('Error saving rule to backend:', e);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
    try {
      await fetch(`/api/routes?id=${ruleId}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error('Error deleting rule from backend:', e);
    }
  };

  const handleToggleRuleActive = async (ruleId: string) => {
    let updatedRule: RoutingRule | undefined;
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === ruleId) {
          const nextActive = !r.active;
          updatedRule = { ...r, active: nextActive };
          showToast('info', nextActive ? 'Rule Activated' : 'Rule Paused', r.label);
          return updatedRule;
        }
        return r;
      })
    );

    if (updatedRule) {
      try {
        await fetch('/api/routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rule: updatedRule }),
        });
      } catch (e) {
        console.error('Error updating rule state:', e);
      }
    }
  };

  const handleSaveFallback = async (settings: FallbackSettings) => {
    setFallbackSettings(settings);
    try {
      await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fallbackSettings: settings }),
      });
    } catch (e) {
      console.error('Error saving fallback settings:', e);
    }
  };

  const handleQuickSimulate = () => {
    setActiveTab('simulator');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans transition-colors">
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedCall(null);
        }}
        rulesCount={rules.filter((r) => r.active).length}
        logsCount={calls.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <TopNavbar
          currentTab={activeTab}
          environment={environment}
          onEnvironmentChange={(env) => {
            setEnvironment(env);
            showToast('info', 'Environment Switched', `Active Mode: ${env.toUpperCase()}`);
          }}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onQuickSimulate={handleQuickSimulate}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
                <span className="text-xs font-mono">Syncing live telephony state...</span>
              </div>
            ) : (
              <>
                {activeTab === 'overview' && (
                  <OverviewPage
                    calls={calls}
                    onSelectCall={(call) => {
                      setSelectedCall(call);
                      setActiveTab('logs');
                    }}
                    onNavigateToSimulator={() => setActiveTab('simulator')}
                  />
                )}

                {activeTab === 'rules' && (
                  <RoutingRulesPage
                    rules={rules}
                    fallbackSettings={fallbackSettings}
                    onSaveRule={handleSaveRule}
                    onDeleteRule={handleDeleteRule}
                    onSaveFallback={handleSaveFallback}
                    onToggleRuleActive={handleToggleRuleActive}
                    showToast={showToast}
                  />
                )}

                {activeTab === 'simulator' && (
                  <SimulatorPage
                    rules={rules}
                    fallbackSettings={fallbackSettings}
                    onRefreshCalls={fetchLiveCalls}
                    showToast={showToast}
                  />
                )}

                {activeTab === 'logs' && (
                  <CallLogsPage
                    calls={calls}
                    selectedCall={selectedCall}
                    onSelectCall={setSelectedCall}
                    showToast={showToast}
                  />
                )}

                {activeTab === 'settings' && (
                  <IntegrationSettingsPage showToast={showToast} />
                )}

                {activeTab === 'help' && <HelpGuidePage />}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
