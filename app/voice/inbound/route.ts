// app/voice/inbound/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { pickDestination, addCallLogEntry, callrouteStore } from '@/lib/routing-store';

/**
 * SignalWire Inbound Call Webhook (POST /voice/inbound)
 * Invoked by SignalWire when an inbound call hits any registered phone number.
 */
export async function POST(req: NextRequest) {
  try {
    let to = '';
    let from = '';
    let callSid = '';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      to = (formData.get('To') as string) || '';
      from = (formData.get('From') as string) || '';
      callSid = (formData.get('CallSid') as string) || '';
    } else {
      try {
        const json = await req.json();
        to = json.To || json.to || '';
        from = json.From || json.from || '';
        callSid = json.CallSid || json.callSid || '';
      } catch {
        const text = await req.text();
        const params = new URLSearchParams(text);
        to = params.get('To') || '';
        from = params.get('From') || '';
        callSid = params.get('CallSid') || '';
      }
    }

    if (!callSid) {
      callSid = `CA${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 12)}`;
    }

    const { destination, agentName, sourceType, matchedRule, reason } = pickDestination(to, from);
    const timeout = matchedRule?.timeoutSeconds || callrouteStore.fallbackSettings.ringTimeoutSeconds || 25;

    // Build cXML instruction
    const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <!-- Inbound Passthrough: Route to ${agentName} -->
  <Dial callerId="${to || destination}" timeout="${timeout}" action="/voice/dial-result">
    <Number>${destination}</Number>
  </Dial>
</Response>`;

    // Log call dynamically
    addCallLogEntry({
      callSid,
      from: from || '+15550000000',
      to: to || destination,
      sourceType,
      destinationNumber: destination,
      destinationAgent: agentName,
      status: 'in-progress',
      durationSeconds: 0,
      ringTimeSeconds: Math.floor(Math.random() * 8) + 5,
      matchedRuleId: matchedRule?.id,
      requestPayload: {
        To: to,
        From: from,
        CallSid: callSid,
        Direction: 'inbound',
      },
      inboundXml: xmlResponse,
    });

    return new NextResponse(xmlResponse, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'X-Routing-Reason': reason,
      },
    });
  } catch (error: any) {
    console.error('[Inbound Webhook Error]:', error);
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>${callrouteStore.fallbackSettings.sayMessage}</Say>
  <Dial timeout="25">
    <Number>${callrouteStore.fallbackSettings.fallbackNumber}</Number>
  </Dial>
</Response>`;
    return new NextResponse(fallbackXml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    endpoint: '/voice/inbound',
    description: 'SignalWire Inbound Call Webhook. Expects form-encoded POST.',
  });
}
