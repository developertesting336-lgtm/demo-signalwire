// app/api/routes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callrouteStore, upsertRule, deleteRule } from '@/lib/routing-store';
import { RoutingRule, FallbackSettings } from '@/types/telephony';

export async function GET() {
  return NextResponse.json({
    routes: callrouteStore.routes,
    fallbackSettings: callrouteStore.fallbackSettings,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.rule) {
      const saved = upsertRule(body.rule as RoutingRule);
      return NextResponse.json({ success: true, rule: saved });
    }

    if (body.fallbackSettings) {
      callrouteStore.fallbackSettings = body.fallbackSettings as FallbackSettings;
      return NextResponse.json({ success: true, fallbackSettings: callrouteStore.fallbackSettings });
    }

    if (Array.isArray(body.routes)) {
      callrouteStore.routes = body.routes;
      return NextResponse.json({ success: true, routes: callrouteStore.routes });
    }

    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing rule id' }, { status: 400 });
  }
  const deleted = deleteRule(id);
  return NextResponse.json({ success: deleted });
}
