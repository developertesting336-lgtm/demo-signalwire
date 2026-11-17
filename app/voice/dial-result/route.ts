// app/voice/dial-result/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateCallLogStatus, callrouteStore } from '@/lib/routing-store';

/**
 * SignalWire Dial Result Webhook Callback (POST /voice/dial-result)
 * Triggered by SignalWire once the primary <Dial> terminates.
 */
export async function POST(req: NextRequest) {
  try {
    let callSid = '';
    let dialCallStatus = '';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      callSid = (formData.get('CallSid') as string) || '';
      dialCallStatus = (formData.get('DialCallStatus') as string) || '';
    } else {
      try {
        const json = await req.json();
        callSid = json.CallSid || json.callSid || '';
        dialCallStatus = json.DialCallStatus || json.dialCallStatus || '';
      } catch {
        const text = await req.text();
        const params = new URLSearchParams(text);
        callSid = params.get('CallSid') || '';
        dialCallStatus = params.get('DialCallStatus') || '';
      }
    }

    const isSuccessful = dialCallStatus === 'completed' || dialCallStatus === 'answered';

    if (isSuccessful) {
      const hangupXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <!-- Primary dial succeeded. Hang up call. -->
  <Hangup/>
</Response>`;

      updateCallLogStatus(callSid, 'completed', {
        durationSeconds: Math.floor(Math.random() * 140) + 30,
        resultXml: hangupXml,
        dialResultStatus: dialCallStatus as any,
      });

      return new NextResponse(hangupXml, {
        status: 200,
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
      });
    }

    // Call was not answered, busy, or failed -> Route to Fallback Number
    const fallback = callrouteStore.fallbackSettings;
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <!-- Outcome: ${dialCallStatus}. Forwarding to Fallback -->
  <Say voice="alice">${fallback.sayMessage}</Say>
  <Dial timeout="${fallback.ringTimeoutSeconds}">
    <Number>${fallback.fallbackNumber}</Number>
  </Dial>
</Response>`;

    updateCallLogStatus(callSid, 'fallback-used', {
      durationSeconds: 25,
      resultXml: fallbackXml,
      dialResultStatus: dialCallStatus as any,
    });

    return new NextResponse(fallbackXml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  } catch (error: any) {
    console.error('[Dial Result Error]:', error);
    const hangupXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Hangup/>
</Response>`;
    return new NextResponse(hangupXml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    endpoint: '/voice/dial-result',
    description: 'SignalWire Dial Result Webhook Callback.',
  });
}
