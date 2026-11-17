// components/pages/IntegrationSettingsPage.tsx
// 100% Dynamic: Fetches live credentials from backend /api/settings and tests connection dynamically
import React, { useState, useEffect } from 'react';
import { Icons } from '../ui/Icons';
import { IntegrationSettings } from '@/types/telephony';

interface IntegrationSettingsPageProps {
  showToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
}

export const IntegrationSettingsPage: React.FC<IntegrationSettingsPageProps> = ({
  showToast,
}) => {
  const [settings, setSettings] = useState<IntegrationSettings>({
    spaceUrl: '',
    projectId: '',
    apiToken: '',
    environment: 'demo',
  });
  const [showToken, setShowToken] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string>('');

  // Readiness checklist state
  const [checklist, setChecklist] = useState({
    signatureValidation: true,
    callLogging: true,
    fallbackTested: true,
    stagingTested: true,
    rollbackPlan: false,
  });

  const domainUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const inboundUrl = `${domainUrl}/voice/inbound`;
  const dialResultUrl = `${domainUrl}/voice/dial-result`;

  // Fetch live settings from backend API
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
        }
      })
      .catch((err) => console.error('Failed to load settings:', err));
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(label);
    showToast('info', 'Copied URL', text);
    setTimeout(() => setCopiedUrl(''), 2000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-connection',
          spaceUrl: settings.spaceUrl,
          projectId: settings.projectId,
        }),
      });
      const data = await res.json();
      setIsTesting(false);
      setTestResult({
        success: data.success,
        message: data.message,
      });

      if (data.success) {
        showToast('success', 'SignalWire Connected', data.message);
      } else {
        showToast('error', 'Connection Check Failed', data.message);
      }
    } catch (err: any) {
      setIsTesting(false);
      setTestResult({ success: false, message: err.message || 'Network error' });
      showToast('error', 'Connection Error', 'Could not reach backend test endpoint');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        showToast('success', 'Settings Saved', 'Integration credentials updated in live store');
      }
    } catch {
      showToast('error', 'Error', 'Failed to save settings');
    }
  };

  return (
    <div className="space-y-6">
      {/* Read-Only Webhook Endpoints */}
      <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            SignalWire Webhook URLs
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure these URLs in your SignalWire Space dashboard under Phone Numbers &gt; Voice Settings (cXML / LaML mode).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Endpoint 1 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                1. Primary Inbound Webhook
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                POST
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-900 dark:text-slate-200 truncate">
              {inboundUrl}
            </div>
            <button
              onClick={() => copyToClipboard(inboundUrl, 'inbound')}
              className="w-full py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-[11px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer bg-transparent"
            >
              <Icons.Copy className="w-3.5 h-3.5" />
              <span>{copiedUrl === 'inbound' ? 'Copied URL!' : 'Copy Inbound URL'}</span>
            </button>
          </div>

          {/* Endpoint 2 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                2. Dial Result Callback
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                POST
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-900 dark:text-slate-200 truncate">
              {dialResultUrl}
            </div>
            <button
              onClick={() => copyToClipboard(dialResultUrl, 'dial-result')}
              className="w-full py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-[11px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer bg-transparent"
            >
              <Icons.Copy className="w-3.5 h-3.5" />
              <span>{copiedUrl === 'dial-result' ? 'Copied URL!' : 'Copy Callback URL'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* SignalWire Credentials Form */}
      <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              SignalWire API Credentials
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Dynamically loaded from your environment configurations.
            </p>
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
            Never Commit Secrets to Git
          </span>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                SignalWire Space URL
              </label>
              <input
                type="text"
                value={settings.spaceUrl}
                onChange={(e) => setSettings({ ...settings, spaceUrl: e.target.value })}
                placeholder="yourname.signalwire.com"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Project ID
              </label>
              <input
                type="text"
                value={settings.projectId}
                onChange={(e) => setSettings({ ...settings, projectId: e.target.value })}
                placeholder="project-id-uuid"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                API Token (Auth Secret)
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={settings.apiToken}
                  onChange={(e) => setSettings({ ...settings, apiToken: e.target.value })}
                  placeholder="PT... or token"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-3 pr-10 py-2.5 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-0 bg-transparent cursor-pointer"
                >
                  {showToken ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
            <Icons.AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Client Security Protocol:</strong> Never request or share AWS root logins or master passwords in chat. Always ask for an invited Space member seat with limited permissions or a dedicated API token.
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer border-0"
              >
                {isTesting ? <Icons.Refresh className="w-4 h-4 animate-spin" /> : <Icons.Activity className="w-4 h-4" />}
                <span>{isTesting ? 'Validating Connection...' : 'Test Connection'}</span>
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                Save Credentials
              </button>
            </div>

            {testResult && (
              <span
                className={`text-xs font-semibold flex items-center gap-1.5 ${
                  testResult.success
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {testResult.success ? <Icons.Check className="w-4 h-4" /> : <Icons.X className="w-4 h-4" />}
                <span>{testResult.message}</span>
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Go-Live Readiness Checklist */}
      <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Go-Live Readiness Checklist
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verify these 5 production gates before cutting over live phone numbers in the client&apos;s Upwork project.
          </p>
        </div>

        <div className="space-y-2.5 text-xs">
          {[
            {
              key: 'signatureValidation' as const,
              label: '1. Webhook Signature Validation (HMAC-SHA1)',
              desc: 'Confirm only authentic SignalWire requests can hit the webhook, preventing unauthorized spoofing.',
            },
            {
              key: 'callLogging' as const,
              label: '2. Call Detail Record (CDR) Logging',
              desc: 'Every CallSid, To, From, and DialCallStatus is persistently stored for auditing and dispute resolution.',
            },
            {
              key: 'fallbackTested' as const,
              label: '3. Fallback Route Verified',
              desc: 'Simulated 25s agent no-answer and busy tones to verify callers safely escalate to the overflow desk.',
            },
            {
              key: 'stagingTested' as const,
              label: '4. Staging Environment Validation',
              desc: 'End-to-end calls routed through a non-production test number with real phones prior to live cutover.',
            },
            {
              key: 'rollbackPlan' as const,
              label: '5. Instant Rollback Plan Agreed',
              desc: 'Documented 60-second procedure to repoint SignalWire number to the previous Twilio/fallback handler if issues arise.',
            },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={checklist[item.key]}
                onChange={(e) => setChecklist({ ...checklist, [item.key]: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-0"
              />
              <div className="flex-1">
                <div className="font-semibold text-slate-900 dark:text-white">{item.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                  checklist[item.key]
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {checklist[item.key] ? 'PASS' : 'TODO'}
              </span>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
};
