// app/api/simulate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { pickDestination, callrouteStore } from '@/lib/routing-store';

export async function POST(req: NextRequest) {
  try {
    const { type, to, from, callSid, dialCallStatus } = await req.json();
    const origin = req.nextUrl.origin;

    if (type === 'dial-result') {
      const form = new URLSearchParams();
      form.append('CallSid', callSid || `CA${Date.now()}`);
      form.append('DialCallStatus', dialCallStatus || 'no-answer');

      const res = await fetch(`${origin}/voice/dial-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      });

      const xml = await res.text();
      return NextResponse.json({
        type: 'dial-result',
        status: res.status,
        xml,
      });
    }

    // Default: Inbound call simulation
    const form = new URLSearchParams();
    form.append('To', to || '+15550000001');
    form.append('From', from || '+15552340088');
    form.append('CallSid', callSid || `CA${Math.random().toString(36).substring(2, 12)}`);

    const res = await fetch(`${origin}/voice/inbound`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

    const xml = await res.text();
    const decision = pickDestination(to, from);

    return NextResponse.json({
      type: 'inbound',
      status: res.status,
      xml,
      matchedRule: decision.matchedRule,
      reason: decision.reason,
      destination: decision.destination,
      agentName: decision.agentName,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
