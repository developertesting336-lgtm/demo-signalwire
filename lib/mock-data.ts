// lib/mock-data.ts
// Dynamic starter templates (No hardcoded fake static logs)
import { RoutingRule, FallbackSettings, CallLogEntry } from '@/types/telephony';

export const initialCallLogs: CallLogEntry[] = [];

export const initialRoutingRules: RoutingRule[] = [
  {
    id: 'rule-ad-auto',
    inboundNumber: '+15550000001',
    label: 'Google Ads - Auto Line',
    sourceType: 'Ad Campaign',
    destinationNumber: '+15551110001',
    agentName: 'Sarah Jenkins (Specialist)',
    priority: 1,
    timeoutSeconds: 25,
    active: true,
    totalCallsRouted: 0,
    createdAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'rule-transfer-desk',
    inboundNumber: '+15550000002',
    label: 'Warm Transfer Desk',
    sourceType: 'Transfer Desk',
    destinationNumber: '+15551110002',
    agentName: 'Michael Chang (Sr. Underwriter)',
    priority: 1,
    timeoutSeconds: 30,
    active: true,
    totalCallsRouted: 0,
    createdAt: new Date().toISOString().split('T')[0],
  },
];

export const initialFallbackSettings: FallbackSettings = {
  fallbackNumber: '+15559990000',
  fallbackAgentName: 'National Overflow Center',
  ringTimeoutSeconds: 25,
  sayMessage: 'Please hold while we connect you to our national backup desk.',
  voicemailEnabled: true,
};
