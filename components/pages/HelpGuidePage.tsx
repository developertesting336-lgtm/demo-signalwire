// components/pages/HelpGuidePage.tsx
import React from 'react';
import { Icons } from '../ui/Icons';

export const HelpGuidePage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Mental Model & Architecture Flow */}
      <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Icons.HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>SignalWire Inbound Call Passthrough Mental Model</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Understanding the core 4-step passthrough cycle between the caller, SignalWire, your backend, and the insurance agent.
          </p>
        </div>

        {/* Visual Architecture Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">Step 1: Caller Dials</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                PSTN
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              A consumer clicks an online insurance ad or is transferred from a partner call center, dialing a phone number hosted on SignalWire.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">Step 2: SignalWire Webhook</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                HTTP POST
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              SignalWire does not make routing decisions. It immediately makes an HTTP POST request to your backend URL (<code className="text-indigo-600 dark:text-indigo-400 font-mono">/voice/inbound</code>) with call parameters: <code className="font-mono">To</code>, <code className="font-mono">From</code>, <code className="font-mono">CallSid</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">Step 3: Backend Routing</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                cXML
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Your server inspects the dialed number to identify if it is an ad or a transfer. It replies with XML instructing SignalWire to connect the caller to a specific agent:
              <br />
              <code className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">&lt;Dial callerId=&quot;...&quot;&gt;&lt;Number&gt;...&lt;/Number&gt;&lt;/Dial&gt;</code>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">Step 4: Callback Fallback</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                Fallback
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              SignalWire dials the agent. If answered, the call completes. If the agent does not answer in 25 seconds or is busy, SignalWire calls <code className="text-amber-600 dark:text-amber-400 font-mono">/voice/dial-result</code> and your server routes the caller to the fallback desk.
            </p>
          </div>
        </div>
      </section>

      {/* Telephony Glossary */}
      <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Telephony & SignalWire Glossary
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Key vocabulary and technical concepts used throughout this passthrough implementation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-900 dark:text-white font-mono text-sm mb-1">
              Webhook
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              An HTTP POST request that an external telecommunications carrier (SignalWire) sends to your public server when an event happens (such as a phone ringing or a dial terminating).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-900 dark:text-white font-mono text-sm mb-1">
              cXML / LaML
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Compatibility XML (SignalWire&apos;s drop-in equivalent for Twilio TwiML). It contains instructions like <code className="font-mono text-indigo-500">&lt;Response&gt;</code>, <code className="font-mono text-indigo-500">&lt;Dial&gt;</code>, <code className="font-mono text-indigo-500">&lt;Say&gt;</code>, and <code className="font-mono text-indigo-500">&lt;Hangup/&gt;</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-900 dark:text-white font-mono text-sm mb-1">
              CallSid
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              A 34-character unique alphanumeric identifier created by SignalWire for every phone call session. It is passed in every webhook payload and used as the primary key in call logs.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-900 dark:text-white font-mono text-sm mb-1">
              E.164 Format
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              The international telecommunications standard for phone numbers. Starts with a plus sign (<code className="font-mono text-indigo-500">+</code>), followed by country code and subscriber number with no spaces, dashes, or parentheses (e.g. <code className="font-mono text-indigo-500">+15550000001</code>).
            </p>
          </div>
        </div>
      </section>

      {/* Commercial & Freelancer Best Practices */}
      <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Client Engagement Guidelines (Brian / CradleStudios)
        </h3>
        <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 list-disc list-inside leading-relaxed">
          <li><strong>Out of Scope:</strong> Brian narrowed the scope to inbound passthrough only. Outbound calling, IVR menus, conferencing, and browser softphones are separate deliverables.</li>
          <li><strong>Caller ID Rule:</strong> The <code className="font-mono text-slate-300">callerId</code> in <code className="font-mono text-slate-300">&lt;Dial&gt;</code> must be a phone number owned on SignalWire (the dialed number <code className="font-mono text-slate-300">To</code>) to prevent carrier spoofing blocks.</li>
          <li><strong>Upwork Safety:</strong> Keep all discussions and milestones on Upwork. Never ask for root passwords. Ask the client to rotate credentials once testing concludes.</li>
        </ul>
      </section>
    </div>
  );
};
