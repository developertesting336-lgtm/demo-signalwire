// components/pages/OverviewPage.tsx
// 100% Dynamic Telemetry & KPI Engine (Calculated live from actual call records)
import React, { useState, useMemo } from 'react';
import { CallLogEntry } from '@/types/telephony';
import { Icons } from '../ui/Icons';

interface OverviewPageProps {
  calls: CallLogEntry[];
  onSelectCall: (call: CallLogEntry) => void;
  onNavigateToSimulator: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  calls,
  onSelectCall,
  onNavigateToSimulator,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ hour: string; calls: number; answered: number } | null>(null);

  // Dynamically calculate KPIs from real call state
  const totalCallsToday = calls.length;
  const answeredCalls = calls.filter((c) => c.status === 'completed').length;
  const fallbackCalls = calls.filter((c) => c.status === 'fallback-used').length;
  const answerRate = totalCallsToday > 0 ? Math.round((answeredCalls / totalCallsToday) * 100) : 0;
  const fallbackRate = totalCallsToday > 0 ? Math.round((fallbackCalls / totalCallsToday) * 100) : 0;
  const avgRingTime = totalCallsToday > 0
    ? (calls.reduce((acc, c) => acc + (c.ringTimeSeconds || 0), 0) / totalCallsToday).toFixed(1)
    : '0.0';

  // Dynamic Source Breakdown for Donut Chart
  const adCalls = calls.filter((c) => c.sourceType === 'Ad Campaign').length;
  const transferCalls = calls.filter((c) => c.sourceType === 'Transfer Desk').length;
  const adPercent = totalCallsToday > 0 ? Math.round((adCalls / totalCallsToday) * 100) : 0;
  const transferPercent = totalCallsToday > 0 ? 100 - adPercent : 0;

  // Donut SVG circumference calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const adOffset = totalCallsToday > 0 ? circumference - (adPercent / 100) * circumference : circumference;

  // Dynamically generate Hourly Data from actual call timestamps
  const hourlyCallData = useMemo(() => {
    // Generate buckets for last 6 hours
    const buckets: Record<string, { hour: string; calls: number; answered: number }> = {};
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      buckets[hStr] = { hour: hStr, calls: 0, answered: 0 };
    }

    // Populate with actual calls
    calls.forEach((c) => {
      if (c.timestamp) {
        // extract hour representation
        const parts = c.timestamp.split(':');
        if (parts.length >= 2) {
          const ampm = c.timestamp.includes('PM') ? 'PM' : c.timestamp.includes('AM') ? 'AM' : '';
          const hourKey = `${parts[0]}:00 ${ampm}`.trim();
          if (buckets[hourKey]) {
            buckets[hourKey].calls += 1;
            if (c.status === 'completed') buckets[hourKey].answered += 1;
          }
        }
      }
    });

    const result = Object.values(buckets);
    // If empty, ensure at least placeholder points for SVG rendering
    if (result.length === 0) {
      return [
        { hour: '10:00', calls: 0, answered: 0 },
        { hour: '11:00', calls: 0, answered: 0 },
        { hour: '12:00', calls: 0, answered: 0 },
        { hour: '13:00', calls: 0, answered: 0 },
      ];
    }
    return result;
  }, [calls]);

  const maxCalls = Math.max(...hourlyCallData.map((d) => d.calls), 5);

  const getStatusBadge = (status: CallLogEntry['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Completed
          </span>
        );
      case 'fallback-used':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            Fallback Used
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            In Progress
          </span>
        );
      case 'no-answer':
      case 'busy':
      case 'failed':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Dynamic KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Calls Today</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Icons.Phone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {totalCallsToday}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {totalCallsToday === 0 ? 'No calls yet' : 'Live count'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Inbound calls received via SignalWire
          </p>
        </div>

        {/* KPI 2 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Answer Rate</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Icons.ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {answerRate}%
            </span>
            <span className="text-xs font-semibold text-slate-500 font-mono">
              {answeredCalls} of {totalCallsToday}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Connected to primary agent destination
          </p>
        </div>

        {/* KPI 3 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Fallback Escalation</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Icons.PhoneForwarded className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {fallbackRate}%
            </span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              {fallbackCalls} calls
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Rerouted to backup overflow number
          </p>
        </div>

        {/* KPI 4 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Avg. Ring Duration</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Icons.Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {avgRingTime}s
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Live Ring Metric
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Time elapsed before pick up or fallback
          </p>
        </div>
      </section>

      {/* Dynamic Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calls per Hour Area Chart */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Inbound Traffic per Hour
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dynamic hourly call volume calculated from actual call detail records
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                <span className="text-slate-500 dark:text-slate-400">Total Calls</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="text-slate-500 dark:text-slate-400">Answered</span>
              </div>
            </div>
          </div>

          {/* SVG Area / Line Chart */}
          <div className="relative h-48 w-full mt-2">
            <svg viewBox="0 0 500 160" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[40, 80, 120].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="500"
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-100 dark:text-slate-800"
                  strokeDasharray="4 4"
                />
              ))}

              {/* Area path */}
              <path
                d={`M 0,160 ${hourlyCallData
                  .map((d, i) => {
                    const x = (i / (hourlyCallData.length - 1)) * 500;
                    const y = 150 - (d.calls / maxCalls) * 130;
                    return `L ${x},${y}`;
                  })
                  .join(' ')} L 500,160 Z`}
                fill="url(#chartGradient)"
              />

              {/* Line path: Total Calls */}
              <path
                d={hourlyCallData
                  .map((d, i) => {
                    const x = (i / (hourlyCallData.length - 1)) * 500;
                    const y = 150 - (d.calls / maxCalls) * 130;
                    return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#4f46e5"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Line path: Answered Calls */}
              <path
                d={hourlyCallData
                  .map((d, i) => {
                    const x = (i / (hourlyCallData.length - 1)) * 500;
                    const y = 150 - (d.answered / maxCalls) * 130;
                    return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="3 3"
              />

              {/* Data points */}
              {hourlyCallData.map((d, i) => {
                const x = (i / (hourlyCallData.length - 1)) * 500;
                const y = 150 - (d.calls / maxCalls) * 130;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="4"
                    className="fill-white dark:fill-slate-900 stroke-indigo-600 stroke-[2.5] cursor-pointer hover:r-6 transition-all"
                    onMouseEnter={() => setHoveredPoint(d)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                );
              })}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint && (
              <div className="absolute top-2 right-2 p-2 rounded-lg bg-slate-900 text-white text-[11px] shadow-lg border border-slate-700 pointer-events-none">
                <span className="font-bold">{hoveredPoint.hour}</span>: {hoveredPoint.calls} calls ({hoveredPoint.answered} answered)
              </div>
            )}
          </div>

          {/* X Axis Labels */}
          <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-2 px-1">
            {hourlyCallData.map((d, i) => (
              <span key={i}>{d.hour}</span>
            ))}
          </div>
        </div>

        {/* Dynamic Donut Chart: Traffic by Source */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Traffic by Campaign Source
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live proportion of Ad Campaigns vs. Transfers
            </p>
          </div>

          <div className="py-4 flex items-center justify-center">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={totalCallsToday > 0 ? '#3b82f6' : '#334155'}
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset="0"
                />
                {totalCallsToday > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#4f46e5"
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={adOffset}
                    strokeLinecap="round"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {totalCallsToday > 0 ? `${adPercent}%` : '0%'}
                </span>
                <span className="text-[10px] uppercase font-semibold text-slate-400">
                  {totalCallsToday > 0 ? 'Ad Leads' : 'Empty'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-600"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Ad Campaigns</span>
              </div>
              <span className="font-mono text-slate-500 dark:text-slate-400">{adCalls} calls ({adPercent}%)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Warm Transfers</span>
              </div>
              <span className="font-mono text-slate-500 dark:text-slate-400">{transferCalls} calls ({transferPercent}%)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Calls Table */}
      <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Call Detail Records ({calls.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live inbound call attempts handled by the passthrough routing engine
            </p>
          </div>
          <button
            onClick={onNavigateToSimulator}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 border-0 bg-transparent cursor-pointer"
          >
            <span>Simulate New Call</span>
            <Icons.ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">CallSid</th>
                <th className="py-2.5 px-3">From (Caller)</th>
                <th className="py-2.5 px-3">To (SignalWire)</th>
                <th className="py-2.5 px-3">Source</th>
                <th className="py-2.5 px-3">Destination Agent</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {calls.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Icons.Phone className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                      <p className="font-semibold text-slate-600 dark:text-slate-300">No calls recorded yet</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Use the Call Simulator or make a real call to your SignalWire phone number to start populating live call detail records.
                      </p>
                      <button
                        onClick={onNavigateToSimulator}
                        className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
                      >
                        Launch Call Simulator
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                calls.slice(0, 8).map((call) => (
                  <tr
                    key={call.id}
                    onClick={() => onSelectCall(call)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                      {call.timestamp}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                      {call.callSid.substring(0, 10)}...
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-900 dark:text-white font-medium">
                      {call.from}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400">
                      {call.to}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {call.sourceType}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {call.destinationAgent}
                      </span>
                      <span className="block font-mono text-[10px] text-slate-400">
                        {call.destinationNumber}
                      </span>
                    </td>
                    <td className="py-3 px-3">{getStatusBadge(call.status)}</td>
                    <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400">
                      {call.durationSeconds > 0 ? `${call.durationSeconds}s` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button className="text-indigo-600 dark:text-indigo-400 group-hover:underline text-[11px] font-semibold border-0 bg-transparent cursor-pointer">
                        cXML →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
