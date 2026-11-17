// components/pages/SimulatorPage.tsx
// 100% Dynamic: Calls backend /api/simulate and /voice/inbound over HTTP to produce real cXML and save real CDRs
import React, { useState } from 'react';
import { RoutingRule, FallbackSettings, SimulationStep } from '@/types/telephony';
import { Icons } from '../ui/Icons';

interface SimulatorPageProps {
  rules: RoutingRule[];
  fallbackSettings: FallbackSettings;
  onRefreshCalls: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
}

export const SimulatorPage: React.FC<SimulatorPageProps> = ({
  rules,
  fallbackSettings,
  onRefreshCalls,
  showToast,
}) => {
  // Input form state
  const [selectedTo, setSelectedTo] = useState<string>(rules[0]?.inboundNumber || '+15550000001');
  const [fromNumber, setFromNumber] = useState<string>('+15552340088');
  const [callSid, setCallSid] = useState<string>('CA' + Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12));
  const [dialResultOption, setDialResultOption] = useState<'completed' | 'no-answer' | 'busy' | 'failed'>('no-answer');

  // Simulation state
  const [isRunningInbound, setIsRunningInbound] = useState(false);
  const [isRunningDialResult, setIsRunningDialResult] = useState(false);
  const [hasInboundRun, setHasInboundRun] = useState(false);
  const [hasDialResultRun, setHasDialResultRun] = useState(false);
  const [matchedRule, setMatchedRule] = useState<RoutingRule | null>(null);
  const [routingReason, setRoutingReason] = useState<string>('');
  const [inboundJsonPayload, setInboundJsonPayload] = useState<any>(null);
  const [inboundXml, setInboundXml] = useState<string>('');
  const [dialResultXml, setDialResultXml] = useState<string>('');
  const [copiedPanel, setCopiedPanel] = useState<string>('');

  // Animated Timeline steps
  const [steps, setSteps] = useState<SimulationStep[]>([
    { step: 'received', label: '1. Call Received', description: 'PSTN caller connected to SignalWire DID', timestamp: '—', status: 'pending' },
    { step: 'webhook', label: '2. Webhook Sent', description: 'HTTP POST /voice/inbound dispatched', timestamp: '—', status: 'pending' },
    { step: 'routed', label: '3. Routing Decided', description: 'Rule evaluation & cXML generated', timestamp: '—', status: 'pending' },
    { step: 'dialing', label: '4. Dialing Agent', description: 'SignalWire <Dial> command initiated', timestamp: '—', status: 'pending' },
    { step: 'answered_or_fallback', label: '5. Answered / Fallback', description: 'Post-dial result callback processed', timestamp: '—', status: 'pending' },
    { step: 'completed', label: '6. Completed', description: 'Call session safely terminated with <Hangup/>', timestamp: '—', status: 'pending' },
  ]);

  const generateNewCallSid = () => {
    setCallSid('CA' + Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12));
  };

  const copyCode = (text: string, panel: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPanel(panel);
    showToast('info', 'Copied to Clipboard', panel);
    setTimeout(() => setCopiedPanel(''), 2000);
  };

  // Step 1: Real HTTP Call to /api/simulate -> /voice/inbound
  const handleSendTestCall = async () => {
    setIsRunningInbound(true);
    setHasInboundRun(false);
    setHasDialResultRun(false);
    setDialResultXml('');

    const now = new Date().toLocaleTimeString();

    // Prepare simulated SignalWire request body
    const payload = {
      To: selectedTo,
      From: fromNumber,
      CallSid: callSid,
      AccountSid: 'AC' + '555000111222333444',
      Direction: 'inbound',
      ApiVersion: '2010-04-01',
    };
    setInboundJsonPayload(payload);

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'inbound',
          to: selectedTo,
          from: fromNumber,
          callSid,
        }),
      });

      const data = await res.json();
      setInboundXml(data.xml || '');
      setMatchedRule(data.matchedRule || null);
      setRoutingReason(data.reason || 'Processed by backend passthrough routing engine');

      setSteps([
        { step: 'received', label: '1. Call Received', description: `Caller ${fromNumber} dialed ${selectedTo}`, timestamp: now, status: 'success' },
        { step: 'webhook', label: '2. Webhook Sent', description: 'SignalWire POST /voice/inbound with form data', timestamp: now, status: 'success' },
        { step: 'routed', label: '3. Routing Decided', description: `Target: ${data.agentName || 'Agent'} (${data.destination})`, timestamp: now, status: 'success' },
        { step: 'dialing', label: '4. Dialing Agent', description: 'Executing <Dial> instruction via cXML', timestamp: now, status: 'active' },
        { step: 'answered_or_fallback', label: '5. Answered / Fallback', description: 'Awaiting dial result callback...', timestamp: '—', status: 'pending' },
        { step: 'completed', label: '6. Completed', description: 'Call session pending completion', timestamp: '—', status: 'pending' },
      ]);

      setHasInboundRun(true);
      onRefreshCalls();
      showToast('success', 'Inbound Call Processed', `cXML Dial instruction generated for ${data.destination}`);
    } catch (err: any) {
      showToast('error', 'Simulation Failed', err.message);
    } finally {
      setIsRunningInbound(false);
    }
  };

  // Step 2: Real HTTP Call to /api/simulate -> /voice/dial-result
  const handleSimulateDialResult = async () => {
    if (!hasInboundRun) {
      showToast('error', 'Initiate Test Call First', 'Please run Step 1 before testing the dial callback.');
      return;
    }

    setIsRunningDialResult(true);
    const now = new Date().toLocaleTimeString();
    const isCompleted = dialResultOption === 'completed';

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'dial-result',
          callSid,
          dialCallStatus: dialResultOption,
        }),
      });

      const data = await res.json();
      setDialResultXml(data.xml || '');
      setHasDialResultRun(true);

      // Update steps
      setSteps((prev) => [
        prev[0],
        prev[1],
        prev[2],
        { ...prev[3], status: 'success' },
        {
          step: 'answered_or_fallback',
          label: isCompleted ? '5. Agent Answered' : `5. Fallback Triggered (${dialResultOption})`,
          description: isCompleted
            ? 'Call answered and conversation finished'
            : `Rerouted to ${fallbackSettings.fallbackAgentName} (${fallbackSettings.fallbackNumber})`,
          timestamp: now,
          status: isCompleted ? 'success' : 'warning',
        },
        {
          step: 'completed',
          label: '6. Completed',
          description: isCompleted ? 'Session concluded cleanly with <Hangup/>' : 'Fallback dial executed',
          timestamp: now,
          status: 'success',
        },
      ]);

      onRefreshCalls();
      showToast(isCompleted ? 'success' : 'info', `Dial Result: ${dialResultOption}`, isCompleted ? 'Call completed' : 'Escalated to Fallback');
    } catch (err: any) {
      showToast('error', 'Callback Simulation Failed', err.message);
    } finally {
      setIsRunningDialResult(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <section className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-bold">
              Practice & Client Demonstration Studio
            </span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            SignalWire Inbound Call Simulator
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            Test the complete two-stage passthrough workflow: 1) Incoming webhook to <code className="text-indigo-300 font-mono">/voice/inbound</code>, and 2) Post-dial result callback to <code className="text-indigo-300 font-mono">/voice/dial-result</code> with automatic fallback routing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Format: cXML (LaML)</span>
        </div>
      </section>

      {/* Simulator Control Forms */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stage 1: Inbound Webhook Form */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                1
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Stage 1: Inbound Call Webhook (POST /voice/inbound)
              </h4>
            </div>
            <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
              Live HTTP Webhook
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Dialed Number (&quot;To&quot; SignalWire DID)
              </label>
              <select
                value={selectedTo}
                onChange={(e) => setSelectedTo(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                {rules.map((rule) => (
                  <option key={rule.id} value={rule.inboundNumber}>
                    {rule.inboundNumber} — {rule.label} ({rule.sourceType})
                  </option>
                ))}
                <option value="+15559999999">+15559999999 — Unmapped Number (Test Fallback)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Caller Phone Number (&quot;From&quot;)
              </label>
              <input
                type="text"
                value={fromNumber}
                onChange={(e) => setFromNumber(e.target.value)}
                placeholder="+15552340088"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold text-xs mb-1">
              CallSid (SignalWire Unique Session Identifier)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={callSid}
                onChange={(e) => setCallSid(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={generateNewCallSid}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Generate fresh CallSid"
              >
                <Icons.Refresh className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={handleSendTestCall}
            disabled={isRunningInbound}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer border-0"
          >
            {isRunningInbound ? (
              <span>Dispatching Webhook...</span>
            ) : (
              <>
                <Icons.Play className="w-4 h-4 fill-current" />
                <span>Send Test Call to /voice/inbound</span>
              </>
            )}
          </button>
        </div>

        {/* Stage 2: Dial Result Callback Simulator */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                2
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Stage 2: Simulate Dial Result
              </h4>
            </div>
            <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
              /voice/dial-result
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            SignalWire reports the outcome of the primary agent dial. Choose an outcome to test completion or automatic fallback:
          </p>

          <div className="space-y-2">
            {[
              { id: 'completed', label: 'completed (Primary Agent Answered)', desc: 'Returns <Hangup/> to end call' },
              { id: 'no-answer', label: 'no-answer (Rings 25s Without Answer)', desc: 'Triggers <Say> and <Dial> to Fallback' },
              { id: 'busy', label: 'busy (Primary Agent Line Engaged)', desc: 'Triggers <Say> and <Dial> to Fallback' },
              { id: 'failed', label: 'failed (PSTN Carrier Drop / Error)', desc: 'Triggers <Say> and <Dial> to Fallback' },
            ].map((opt) => (
              <label
                key={opt.id}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  dialResultOption === opt.id
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="dialOption"
                  value={opt.id}
                  checked={dialResultOption === opt.id}
                  onChange={() => setDialResultOption(opt.id as any)}
                  className="mt-0.5 text-indigo-600"
                />
                <div>
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-[11px] text-slate-400">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>

          <button
            onClick={handleSimulateDialResult}
            disabled={!hasInboundRun || isRunningDialResult}
            className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-semibold text-xs transition-all shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer border-0"
          >
            <Icons.PhoneForwarded className="w-4 h-4" />
            <span>{isRunningDialResult ? 'Processing Callback...' : 'Simulate Dial Result Outcome'}</span>
          </button>
        </div>
      </section>

      {/* Visual Step Timeline */}
      <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Icons.Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Visual Passthrough Call Lifecycle Timeline</span>
          </h4>
          <span className="text-[11px] text-slate-400 font-mono">SignalWire Telephony State Machine</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {steps.map((step) => {
            const statusStyles = {
              pending: 'border-slate-200 dark:border-slate-800 text-slate-400 bg-slate-50 dark:bg-slate-950',
              active: 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/20',
              success: 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20',
              warning: 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20',
              error: 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20',
            };

            return (
              <div
                key={step.step}
                className={`p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between ${statusStyles[step.status]}`}
              >
                <div>
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span>{step.label}</span>
                    <span className="font-mono text-[10px] opacity-75">{step.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {step.description}
                  </p>
                </div>
                <div className="mt-2 text-[10px] font-mono uppercase tracking-wider font-semibold">
                  Status: {step.status}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Three-Panel Result View */}
      {hasInboundRun && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Simulated Telephony Payload &amp; Response Inspector
            </h4>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Generated via SignalWire cXML specification
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Panel A: Request Sent */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    A) Request Sent (POST Form Payload)
                  </span>
                  <button
                    onClick={() => copyCode(JSON.stringify(inboundJsonPayload, null, 2), 'Request JSON')}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 border-0 bg-transparent cursor-pointer"
                  >
                    <Icons.Copy className="w-3.5 h-3.5" />
                    <span>{copiedPanel === 'Request JSON' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed">
                  {JSON.stringify(inboundJsonPayload, null, 2)}
                </pre>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                SignalWire transmits parameters form-encoded over HTTPS.
              </p>
            </div>

            {/* Panel B: Routing Decision */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    B) Routing Decision
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    Rule Match
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Matched Rule</span>
                    <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                      {matchedRule ? matchedRule.label : 'None (Fallback Overflow)'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Chosen Destination</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block">
                      {matchedRule ? matchedRule.destinationNumber : fallbackSettings.fallbackNumber}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Representative: {matchedRule ? matchedRule.agentName : fallbackSettings.fallbackAgentName}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Routing Logic Explanation</span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {routingReason}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel C: cXML Response */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    C) Generated cXML Response
                  </span>
                  <button
                    onClick={() => copyCode(hasDialResultRun ? dialResultXml : inboundXml, 'cXML Response')}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 border-0 bg-transparent cursor-pointer"
                  >
                    <Icons.Copy className="w-3.5 h-3.5" />
                    <span>{copiedPanel === 'cXML Response' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <pre className="p-3.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed">
                  {hasDialResultRun ? dialResultXml : inboundXml}
                </pre>
              </div>

              <div className="mt-2 text-[11px] text-slate-500">
                {hasDialResultRun ? (
                  <span>Showing Stage 2 callback XML for: <strong className="text-slate-300">{dialResultOption}</strong></span>
                ) : (
                  <span>Showing Stage 1 inbound XML response. Run Stage 2 to inspect fallback.</span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
