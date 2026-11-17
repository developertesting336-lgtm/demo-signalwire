// app/api/logs/route.ts
import { NextResponse } from 'next/server';
import { callrouteStore } from '@/lib/routing-store';

export async function GET() {
  return NextResponse.json({
    calls: callrouteStore.logs,
  });
}

export async function DELETE() {
  callrouteStore.logs = [];
  return NextResponse.json({ success: true, message: 'All call detail records cleared' });
}
