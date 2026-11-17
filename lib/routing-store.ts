// lib/routing-store.ts
// Live Dynamic Telephony State Store (Backend Singleton)
import { RoutingRule, FallbackSettings, CallLogEntry, IntegrationSettings } from '@/types/telephony';

declare global {
  // eslint-disable-next-line no-var
  var __callroute_store: {
    routes: RoutingRule[];
    fallbackSettings: FallbackSettings;
    logs: CallLogEntry[];
    settings: IntegrationSettings;
  } | undefined;
}

function initLiveStore() {
  const configuredAdNumber = (process.env.SIGNALWIRE_AD_NUMBER || '').trim();
  const configuredTransferNumber = (process.env.SIGNALWIRE_TRANSFER_NUMBER || '').trim();
  const agentA = (process.env.AGENT_A || '+15551110001').trim();
  const agentB = (process.env.AGENT_B || '+15551110002').trim();
  const fallbackNum = (process.env.FALLBACK_NUMBER || '+15551110003').trim();

  const routes: RoutingRule[] = [];

  // Add the primary Ad Campaign line from .env or default test line
  routes.push({
    id: 'rule-ad-campaign',
    inboundNumber: configuredAdNumber || '+15550000001',
    label: configuredAdNumber ? 'Live SignalWire Line (Ad Campaign)' : 'Google Ads - Auto Insurance',
    sourceType: 'Ad Campaign',
    destinationNumber: agentA,
    agentName: 'Sarah Jenkins (Specialist)',
    priority: 1,
    timeoutSeconds: 25,
    active: true,
    totalCallsRouted: 0,
    createdAt: new Date().toISOString().split('T')[0],
  });

  // Add Transfer Desk rule if configured or practice transfer line
  routes.push({
    id: 'rule-transfer-desk',
    inboundNumber: configuredTransferNumber || '+15550000002',
    label: 'Warm Transfer - Partner Center',
    sourceType: 'Transfer Desk',
    destinationNumber: agentB,
    agentName: 'Michael Chang (Sr. Underwriter)',
    priority: 1,
    timeoutSeconds: 30,
    active: true,
    totalCallsRouted: 0,
    createdAt: new Date().toISOString().split('T')[0],
  });

  const fallbackSettings: FallbackSettings = {
    fallbackNumber: fallbackNum,
    fallbackAgentName: 'National Overflow Center',
    ringTimeoutSeconds: 25,
    sayMessage: 'Please hold while we connect you to our national backup desk.',
    voicemailEnabled: true,
  };

  const settings: IntegrationSettings = {
    spaceUrl: (process.env.SIGNALWIRE_SPACE || 'demo.signalwire.com').trim(),
    projectId: (process.env.SIGNALWIRE_PROJECT_ID || '').trim(),
    apiToken: (process.env.SIGNALWIRE_API_TOKEN || '').trim(),
    environment: 'demo',
  };

  return {
    routes,
    fallbackSettings,
    logs: [], // Clean dynamic logs: starts empty until real/simulated calls occur!
    settings,
  };
}

if (!global.__callroute_store) {
  global.__callroute_store = initLiveStore();
}

export const callrouteStore = global.__callroute_store;

export function pickDestination(toNumber: string, fromNumber?: string): {
  destination: string;
  agentName: string;
  sourceType: RoutingRule['sourceType'];
  matchedRule: RoutingRule | null;
  reason: string;
} {
  const cleanTo = (toNumber || '').trim();
  const matched = callrouteStore.routes.find((r) => r.inboundNumber === cleanTo && r.active);

  if (matched) {
    matched.totalCallsRouted += 1;
    return {
      destination: matched.destinationNumber,
      agentName: matched.agentName,
      sourceType: matched.sourceType,
      matchedRule: matched,
      reason: `Matched active rule "${matched.label}" (Priority ${matched.priority}). Dialed number ${cleanTo} maps to ${matched.agentName}.`,
    };
  }

  return {
    destination: callrouteStore.fallbackSettings.fallbackNumber,
    agentName: callrouteStore.fallbackSettings.fallbackAgentName,
    sourceType: 'Ad Campaign',
    matchedRule: null,
    reason: `No active rule matched dialed number ${cleanTo}. Defaulting caller to Fallback Desk (${callrouteStore.fallbackSettings.fallbackNumber}).`,
  };
}

export function addCallLogEntry(entry: Omit<CallLogEntry, 'id' | 'timestamp' | 'isoDate'>): CallLogEntry {
  const now = new Date();
  const newCall: CallLogEntry = {
    ...entry,
    id: `call-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    isoDate: now.toISOString(),
  };

  callrouteStore.logs.unshift(newCall);
  // Keep last 100 calls in memory
  if (callrouteStore.logs.length > 100) {
    callrouteStore.logs.pop();
  }
  return newCall;
}

export function updateCallLogStatus(
  callSid: string,
  status: CallLogEntry['status'],
  additional?: { durationSeconds?: number; resultXml?: string; dialResultStatus?: any }
): boolean {
  const call = callrouteStore.logs.find((c) => c.callSid === callSid);
  if (call) {
    call.status = status;
    if (additional?.durationSeconds !== undefined) call.durationSeconds = additional.durationSeconds;
    if (additional?.resultXml) call.resultXml = additional.resultXml;
    if (additional?.dialResultStatus) call.dialResultStatus = additional.dialResultStatus;
    return true;
  }
  return false;
}

export function upsertRule(rule: RoutingRule): RoutingRule {
  const index = callrouteStore.routes.findIndex((r) => r.id === rule.id);
  if (index >= 0) {
    callrouteStore.routes[index] = rule;
  } else {
    callrouteStore.routes.unshift(rule);
  }
  return rule;
}

export function deleteRule(id: string): boolean {
  const initialLen = callrouteStore.routes.length;
  callrouteStore.routes = callrouteStore.routes.filter((r) => r.id !== id);
  return callrouteStore.routes.length < initialLen;
}
