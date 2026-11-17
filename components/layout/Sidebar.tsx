// components/layout/Sidebar.tsx
import React from 'react';
import { Icons } from '../ui/Icons';

export type NavTabId = 'overview' | 'rules' | 'simulator' | 'logs' | 'settings' | 'help';

interface SidebarProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  rulesCount: number;
  logsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  rulesCount,
  logsCount,
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: Icons.Dashboard },
    { id: 'rules', label: 'Routing Rules', icon: Icons.GitBranch, badge: `${rulesCount}` },
    { id: 'simulator', label: 'Call Simulator', icon: Icons.Play, isLive: true },
    { id: 'logs', label: 'Call Logs', icon: Icons.ScrollText, badge: `${logsCount}` },
    { id: 'settings', label: 'Integration Settings', icon: Icons.Settings },
    { id: 'help', label: 'Help / Guide', icon: Icons.HelpCircle },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none text-slate-100 h-full">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/30">
            <Icons.PhoneForwarded className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              CallRoute Console
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">SignalWire Passthrough</p>
          </div>
        </div>
      </div>

      {/* Navigation list */}
      <div className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Telephony Operations
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as NavTabId)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all border-0 cursor-pointer text-left ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950 font-semibold'
                  : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.isLive && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  KEY
                </span>
              )}

              {item.badge && !item.isLive && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                    isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Client Context Widget */}
      <div className="p-4 border-t border-slate-800 text-xs shrink-0">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Client Practice</span>
            <span className="text-[10px] text-emerald-400 font-mono">cXML Mode</span>
          </div>
          <div className="text-slate-200 font-semibold text-[11px] truncate">
            CradleStudios Inbound
          </div>
          <div className="text-[10px] text-slate-400 leading-tight">
            Passthrough routing from ads &amp; transfers to agent endpoints.
          </div>
        </div>
      </div>
    </aside>
  );
};
