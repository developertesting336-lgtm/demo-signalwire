// components/pages/CallLogsPage.tsx
import React, { useState, useMemo } from 'react';
import { CallLogEntry, CallStatus, SourceType } from '@/types/telephony';
import { Icons } from '../ui/Icons';

interface CallLogsPageProps {
  calls: CallLogEntry[];
  selectedCall: CallLogEntry | null;
  onSelectCall: (call: CallLogEntry | null) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
}

export const CallLogsPage: React.FC<CallLogsPageProps> = ({
  calls,
  selectedCall,
  onSelectCall,
  showToast,
}) => {
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Filtered Calls calculation
  const filteredCalls = useMemo(() => {
    return calls.filter((call) => {
      const matchesSearch =
        searchTerm === '' ||
        call.callSid.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.from.includes(searchTerm) ||
        call.to.includes(searchTerm) ||
        call.destinationAgent.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || call.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || call.sourceType === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [calls, searchTerm, statusFilter, sourceFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredCalls.length / pageSize) || 1;
  const paginatedCalls = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCalls.slice(start, start + pageSize);
  }, [filteredCalls, currentPage, pageSize]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['CallSid', 'Time', 'From', 'To', 'Source', 'DestinationAgent', 'DestinationNumber', 'Status', 'DurationSeconds'];
    const rows = filteredCalls.map((c) => [
      c.callSid,
      c.timestamp,
      c.from,
      c.to,
      c.sourceType,
      c.destinationAgent,
      c.destinationNumber,
      c.status,
      c.durationSeconds,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `callroute_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', 'CSV Export Complete', `Exported ${filteredCalls.length} call logs`);
  };

  const getStatusBadge = (status: CallStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Completed
          </span>
        );
      case 'fallback-used':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            Fallback Used
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            In Progress
          </span>
        );
      case 'no-answer':
      case 'busy':
      case 'failed':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Call Detail Records ({filteredCalls.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive audit trail of inbound webhooks, routing decisions, and cXML payloads
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Icons.Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by CallSid, phone, or agent..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Icons.Search className="w-4 h-4" />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Call Statuses</option>
              <option value="completed">Completed / Answered</option>
              <option value="fallback-used">Fallback Used</option>
              <option value="no-answer">No Answer</option>
              <option value="busy">Busy</option>
              <option value="failed">Failed</option>
              <option value="in-progress">In Progress</option>
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Campaign Sources</option>
              <option value="Ad Campaign">Ad Campaign</option>
              <option value="Transfer Desk">Transfer Desk</option>
            </select>
          </div>
        </div>
      </section>

      {/* Main Table */}
      <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="py-3 px-3">Time</th>
                <th className="py-3 px-3">CallSid</th>
                <th className="py-3 px-3">From</th>
                <th className="py-3 px-3">To (SignalWire)</th>
                <th className="py-3 px-3">Source</th>
                <th className="py-3 px-3">Destination Agent</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Duration</th>
                <th className="py-3 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {paginatedCalls.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No calls matched your filter criteria. Try clearing search filters.
                  </td>
                </tr>
              ) : (
                paginatedCalls.map((call) => (
                  <tr
                    key={call.id}
                    onClick={() => onSelectCall(call)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                      {call.timestamp}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                      {call.callSid.substring(0, 14)}...
                    </td>
                    <td className="py-3.5 px-3 font-mono font-medium text-slate-900 dark:text-white">
                      {call.from}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-500 dark:text-slate-400">
                      {call.to}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {call.sourceType}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {call.destinationAgent}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {call.destinationNumber}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">{getStatusBadge(call.status)}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-500 dark:text-slate-400">
                      {call.durationSeconds > 0 ? `${call.durationSeconds}s` : '—'}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button className="text-indigo-600 dark:text-indigo-400 group-hover:underline text-[11px] font-semibold">
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredCalls.length)} of {filteredCalls.length} calls
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Icons.ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono font-semibold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Icons.ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Call Detail Drawer Modal */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end animate-in fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between border-l border-slate-200 dark:border-slate-800">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Call Detail Record
                    </h3>
                    {getStatusBadge(selectedCall.status)}
                  </div>
                  <div className="font-mono text-xs text-slate-400 mt-1">
                    SID: {selectedCall.callSid}
                  </div>
                </div>
                <button
                  onClick={() => onSelectCall(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              {/* Call Overview Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">From (Caller)</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {selectedCall.from}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">To (SignalWire DID)</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                    {selectedCall.to}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Target Agent</span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                    {selectedCall.destinationAgent}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">{selectedCall.destinationNumber}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Call Duration</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {selectedCall.durationSeconds}s (Ring: {selectedCall.ringTimeSeconds}s)
                  </span>
                </div>
              </div>

              {/* Stage 1 Inbound cXML */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Stage 1: Primary cXML Dial Response
                </label>
                <pre className="p-3.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48 leading-relaxed">
                  {selectedCall.inboundXml || `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${selectedCall.to}" timeout="25" action="/voice/dial-result">
    <Number>${selectedCall.destinationNumber}</Number>
  </Dial>
</Response>`}
                </pre>
              </div>

              {/* Stage 2 Dial Result cXML */}
              {selectedCall.resultXml && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Stage 2: Callback Outcome cXML ({selectedCall.dialResultStatus || 'dial-result'})
                  </label>
                  <pre className="p-3.5 rounded-xl bg-slate-950 text-amber-400 font-mono text-[11px] overflow-x-auto max-h-48 leading-relaxed">
                    {selectedCall.resultXml}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => onSelectCall(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
