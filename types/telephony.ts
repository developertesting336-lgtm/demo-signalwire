// types/telephony.ts

export type SourceType = 'Ad Campaign' | 'Transfer Desk';

export type CallStatus = 'completed' | 'fallback-used' | 'no-answer' | 'busy' | 'failed' | 'in-progress';

export interface RoutingRule {
  id: string;
  inboundNumber: string; // E.164, e.g. +15550000001
  label: string;
  sourceType: SourceType;
  destinationNumber: string; // E.164, e.g. +15551110001
  agentName: string;
  priority: number;
  timeoutSeconds: number;
  active: boolean;
  totalCallsRouted: number;
  createdAt: string;
}

export interface FallbackSettings {
  fallbackNumber: string; // E.164
  fallbackAgentName: string;
  ringTimeoutSeconds: number;
  sayMessage: string;
  voicemailEnabled: boolean;
}

export interface IntegrationSettings {
  spaceUrl: string;
  projectId: string;
  apiToken: string;
  environment: 'demo' | 'staging' | 'production';
}

export interface CallLogEntry {
  id: string;
  callSid: string;
  from: string; // E.164
  to: string; // E.164
  sourceType: SourceType;
  destinationNumber: string;
  destinationAgent: string;
  status: CallStatus;
  durationSeconds: number;
  ringTimeSeconds: number;
  timestamp: string;
  isoDate: string;
  matchedRuleId?: string;
  requestPayload?: {
    To: string;
    From: string;
    CallSid: string;
    AccountSid?: string;
    Direction?: string;
    CallerCity?: string;
    CallerState?: string;
    CallerCountry?: string;
  };
  inboundXml?: string;
  dialResultStatus?: 'completed' | 'answered' | 'no-answer' | 'busy' | 'failed';
  resultXml?: string;
}

export interface SimulationStep {
  step: 'received' | 'webhook' | 'routed' | 'dialing' | 'answered_or_fallback' | 'completed';
  label: string;
  description: string;
  timestamp: string;
  status: 'pending' | 'active' | 'success' | 'warning' | 'error';
}
