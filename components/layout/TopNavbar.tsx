// components/layout/TopNavbar.tsx
import React from 'react';
import { Icons } from '../ui/Icons';
import { NavTabId } from './Sidebar';

export type EnvironmentMode = 'demo' | 'staging' | 'production';

interface TopNavbarProps {
  currentTab: NavTabId;
  environment: EnvironmentMode;
  onEnvironmentChange: (env: EnvironmentMode) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onQuickSimulate: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentTab,
  environment,
  onEnvironmentChange,
  isDarkMode,
  onToggleDarkMode,
  onQuickSimulate,
}) => {
  const tabTitles: Record<NavTabId, { title: string; subtitle: string }> = {
    overview: {
      title: 'Console Overview',
      subtitle: 'Real-time telemetry, KPI metrics, and inbound traffic distribution',
    },
    rules: {
      title: 'Routing Rules & Destination Mapping',
      subtitle: 'Map incoming SignalWire numbers (E.164) to primary agents and fallback overflow',
    },
    simulator: {
      title: 'Call Simulator & cXML Inspector',
      subtitle: 'Simulate SignalWire POST webhooks, trace routing logic, and inspect cXML responses',
    },
    logs: {
      title: 'Call Logs & Detail Records (CDR)',
      subtitle: 'Searchable audit trail of inbound call attempts, agent dispositions, and XML instructions',
    },
    settings: {
      title: 'Integration Settings & Endpoints',
      subtitle: 'Webhook URLs, SignalWire Space credentials, and deployment readiness checklist',
    },
    help: {
      title: 'Architecture Guide & Telephony Glossary',
      subtitle: 'SignalWire passthrough mental model, cXML specification, and handover guidelines',
    },
  };

  const currentInfo = tabTitles[currentTab] || tabTitles.overview;

  return (
    <header className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 transition-colors">
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
          {currentInfo.title}
        </h2>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
          {currentInfo.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Environment Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
          {(['demo', 'staging', 'production'] as EnvironmentMode[]).map((env) => (
            <button
              key={env}
              type="button"
              onClick={() => onEnvironmentChange(env)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg capitalize transition-all border-0 cursor-pointer ${
                environment === env
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {env}
            </button>
          ))}
        </div>

        {/* Webhook Status Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-mono">Webhook healthy (200 OK)</span>
        </div>

        {/* Light / Dark Mode Toggle */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700/60 cursor-pointer bg-transparent"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {isDarkMode ? <Icons.Sun className="w-4 h-4 text-amber-400" /> : <Icons.Moon className="w-4 h-4 text-slate-600" />}
        </button>




        {/* Primary Action Button */}
        <button
          type="button"
          onClick={onQuickSimulate}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 border-0 cursor-pointer"
        >
          <Icons.Play className="w-3.5 h-3.5 fill-current" />
          <span>New Test Call</span>
        </button>
      </div>
    </header>
  );
};
