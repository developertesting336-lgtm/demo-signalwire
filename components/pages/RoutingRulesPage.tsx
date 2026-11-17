// components/pages/RoutingRulesPage.tsx
import React, { useState } from 'react';
import { RoutingRule, FallbackSettings, SourceType } from '@/types/telephony';
import { Icons } from '../ui/Icons';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface RoutingRulesPageProps {
  rules: RoutingRule[];
  fallbackSettings: FallbackSettings;
  onSaveRule: (rule: RoutingRule) => void;
  onDeleteRule: (ruleId: string) => void;
  onSaveFallback: (settings: FallbackSettings) => void;
  onToggleRuleActive: (ruleId: string) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
}

export const RoutingRulesPage: React.FC<RoutingRulesPageProps> = ({
  rules,
  fallbackSettings,
  onSaveRule,
  onDeleteRule,
  onSaveFallback,
  onToggleRuleActive,
  showToast,
}) => {
  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RoutingRule | null>(null);

  // Form State
  const [inboundNumber, setInboundNumber] = useState('');
  const [label, setLabel] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('Ad Campaign');
  const [destinationNumber, setDestinationNumber] = useState('');
  const [agentName, setAgentName] = useState('');
  const [priority, setPriority] = useState<number>(1);
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(25);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fallback edit state
  const [fallbackForm, setFallbackForm] = useState<FallbackSettings>(fallbackSettings);
  const [fallbackSaved, setFallbackSaved] = useState(false);

  // Delete Confirm Dialog state
  const [ruleToDelete, setRuleToDelete] = useState<RoutingRule | null>(null);

  // E.164 validation regex: + followed by 10-15 digits
  const E164_REGEX = /^\+[1-9]\d{7,14}$/;

  const openAddDrawer = () => {
    setEditingRule(null);
    setInboundNumber('+1555');
    setLabel('');
    setSourceType('Ad Campaign');
    setDestinationNumber('+1555');
    setAgentName('');
    setPriority(1);
    setTimeoutSeconds(25);
    setErrors({});
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (rule: RoutingRule) => {
    setEditingRule(rule);
    setInboundNumber(rule.inboundNumber);
    setLabel(rule.label);
    setSourceType(rule.sourceType);
    setDestinationNumber(rule.destinationNumber);
    setAgentName(rule.agentName);
    setPriority(rule.priority);
    setTimeoutSeconds(rule.timeoutSeconds);
    setErrors({});
    setIsDrawerOpen(true);
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!E164_REGEX.test(inboundNumber.trim())) {
      errs.inboundNumber = 'Must be valid E.164 format (e.g. +15550000001)';
    }
    if (!label.trim()) {
      errs.label = 'Label is required';
    }
    if (!E164_REGEX.test(destinationNumber.trim())) {
      errs.destinationNumber = 'Must be valid E.164 format (e.g. +15551110001)';
    }
    if (!agentName.trim()) {
      errs.agentName = 'Agent name is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveDrawer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const ruleData: RoutingRule = {
      id: editingRule ? editingRule.id : `rule-${Date.now()}`,
      inboundNumber: inboundNumber.trim(),
      label: label.trim(),
      sourceType,
      destinationNumber: destinationNumber.trim(),
      agentName: agentName.trim(),
      priority,
      timeoutSeconds,
      active: editingRule ? editingRule.active : true,
      totalCallsRouted: editingRule ? editingRule.totalCallsRouted : 0,
      createdAt: editingRule ? editingRule.createdAt : new Date().toISOString().split('T')[0],
    };

    onSaveRule(ruleData);
    setIsDrawerOpen(false);
    showToast('success', editingRule ? 'Rule Updated' : 'Rule Created', `${ruleData.label} is active`);
  };

  const handleSaveFallbackSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!E164_REGEX.test(fallbackForm.fallbackNumber.trim())) {
      showToast('error', 'Invalid Fallback Number', 'Must be valid E.164 (e.g. +15559990000)');
      return;
    }
    onSaveFallback(fallbackForm);
    setFallbackSaved(true);
    showToast('success', 'Fallback Settings Saved', 'Overflow calls will route to ' + fallbackForm.fallbackNumber);
    setTimeout(() => setFallbackSaved(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Rules Table Header */}
      <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              SignalWire Inbound Phone Rules ({rules.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Calls to your SignalWire phone numbers are matched here to produce cXML &lt;Dial&gt; instructions.
            </p>
          </div>
          <button
            onClick={openAddDrawer}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 self-start sm:self-auto"
          >
            <Icons.Plus className="w-4 h-4" />
            <span>Add Routing Rule</span>
          </button>
        </div>

        {/* Rules Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="py-3 px-3">Dialed Number (E.164)</th>
                <th className="py-3 px-3">Campaign Label</th>
                <th className="py-3 px-3">Source Type</th>
                <th className="py-3 px-3">Destination Agent</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Timeout</th>
                <th className="py-3 px-3">Active</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {rules.map((rule) => (
                <tr
                  key={rule.id}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                    !rule.active ? 'opacity-50' : ''
                  }`}
                >
                  <td className="py-3.5 px-3 font-mono font-bold text-slate-900 dark:text-white text-xs">
                    {rule.inboundNumber}
                  </td>
                  <td className="py-3.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                    {rule.label}
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        rule.sourceType === 'Ad Campaign'
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {rule.sourceType}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {rule.agentName}
                    </div>
                    <div className="font-mono text-[11px] text-slate-400">
                      {rule.destinationNumber}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-mono text-slate-600 dark:text-slate-300">
                    P{rule.priority}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-slate-600 dark:text-slate-300">
                    {rule.timeoutSeconds}s
                  </td>
                  <td className="py-3.5 px-3">
                    {/* Active Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => onToggleRuleActive(rule.id)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                        rule.active ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out ${
                          rule.active ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditDrawer(rule)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title="Edit Rule"
                      >
                        <Icons.Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setRuleToDelete(rule)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                        title="Delete Rule"
                      >
                        <Icons.Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Fallback Configuration Card */}
      <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Icons.PhoneForwarded className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Global Fallback & Overflow Configuration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Triggered automatically when a primary agent fails to answer, is busy, or if a call dials an unmapped DID.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            SignalWire Callback Mode
          </span>
        </div>

        <form onSubmit={handleSaveFallbackSettings} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Fallback Number (E.164)
              </label>
              <input
                type="text"
                value={fallbackForm.fallbackNumber}
                onChange={(e) => setFallbackForm({ ...fallbackForm, fallbackNumber: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Fallback Destination Name
              </label>
              <input
                type="text"
                value={fallbackForm.fallbackAgentName}
                onChange={(e) => setFallbackForm({ ...fallbackForm, fallbackAgentName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Ring Timeout (seconds)
              </label>
              <input
                type="number"
                value={fallbackForm.ringTimeoutSeconds}
                onChange={(e) => setFallbackForm({ ...fallbackForm, ringTimeoutSeconds: parseInt(e.target.value, 10) || 25 })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold text-xs mb-1">
              &lt;Say&gt; Audio Prompt (Spoken to caller prior to fallback dial)
            </label>
            <input
              type="text"
              value={fallbackForm.sayMessage}
              onChange={(e) => setFallbackForm({ ...fallbackForm, sayMessage: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={fallbackForm.voicemailEnabled}
                onChange={(e) => setFallbackForm({ ...fallbackForm, voicemailEnabled: e.target.checked })}
                className="h-4 w-4 rounded bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span className="font-medium">
                Record voicemail if fallback desk also does not answer
              </span>
            </label>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs transition-colors border border-slate-700"
            >
              {fallbackSaved ? '✓ Saved' : 'Save Fallback Settings'}
            </button>
          </div>
        </form>
      </section>

      {/* Add / Edit Rule Side Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between border-l border-slate-200 dark:border-slate-800">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingRule ? 'Edit Routing Rule' : 'New Inbound Routing Rule'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    SignalWire cXML passthrough instruction
                  </p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveDrawer} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Inbound SignalWire Number (E.164) *
                  </label>
                  <input
                    type="text"
                    value={inboundNumber}
                    onChange={(e) => setInboundNumber(e.target.value)}
                    placeholder="+15550000001"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                  {errors.inboundNumber && (
                    <span className="text-[11px] text-rose-500 mt-1 block">{errors.inboundNumber}</span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Rule / Campaign Label *
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Google Ads - Auto Insurance"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                  {errors.label && (
                    <span className="text-[11px] text-rose-500 mt-1 block">{errors.label}</span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Source Type
                  </label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value as SourceType)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Ad Campaign">Ad Campaign</option>
                    <option value="Transfer Desk">Transfer Desk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Destination Agent Phone (E.164) *
                  </label>
                  <input
                    type="text"
                    value={destinationNumber}
                    onChange={(e) => setDestinationNumber(e.target.value)}
                    placeholder="+15551110001"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                  {errors.destinationNumber && (
                    <span className="text-[11px] text-rose-500 mt-1 block">{errors.destinationNumber}</span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Agent Representative Name *
                  </label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="Sarah Jenkins (Specialist)"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                  {errors.agentName && (
                    <span className="text-[11px] text-rose-500 mt-1 block">{errors.agentName}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Priority (1 = Highest)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={priority}
                      onChange={(e) => setPriority(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Ring Timeout (seconds)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={60}
                      value={timeoutSeconds}
                      onChange={(e) => setTimeoutSeconds(parseInt(e.target.value, 10) || 25)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-600/20"
                  >
                    {editingRule ? 'Save Changes' : 'Create Rule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Rule Confirmation Dialog */}
      <ConfirmDialog
        isOpen={ruleToDelete !== null}
        title="Delete Routing Rule?"
        description={`Are you sure you want to delete the rule "${ruleToDelete?.label}" (${ruleToDelete?.inboundNumber})? Inbound calls to this number will fall back to overflow.`}
        confirmLabel="Delete Rule"
        isDestructive={true}
        onConfirm={() => {
          if (ruleToDelete) {
            onDeleteRule(ruleToDelete.id);
            showToast('info', 'Rule Deleted', ruleToDelete.label);
            setRuleToDelete(null);
          }
        }}
        onCancel={() => setRuleToDelete(null)}
      />
    </div>
  );
};
