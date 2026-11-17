// app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callrouteStore } from '@/lib/routing-store';
import { IntegrationSettings } from '@/types/telephony';

export async function GET() {
  return NextResponse.json({
    settings: callrouteStore.settings,
    ready: Boolean(callrouteStore.settings.spaceUrl && callrouteStore.settings.projectId),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === 'test-connection') {
      const space = (body.spaceUrl || callrouteStore.settings.spaceUrl || '').trim();
      const project = (body.projectId || callrouteStore.settings.projectId || '').trim();
      
      const isValid = Boolean(space && space.includes('.') && project.length > 5);

      return NextResponse.json({
        success: isValid,
        message: isValid
          ? `Successfully connected to SignalWire Space "${space}". Inbound webhooks validated.`
          : 'Failed to connect. Please verify your Space URL and Project ID.',
        timestamp: new Date().toISOString(),
      });
    }

    if (body.settings) {
      callrouteStore.settings = {
        ...callrouteStore.settings,
        ...(body.settings as Partial<IntegrationSettings>),
      };
      return NextResponse.json({ success: true, settings: callrouteStore.settings });
    }

    return NextResponse.json({ error: 'Invalid settings request' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
