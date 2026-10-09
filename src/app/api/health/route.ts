import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Preflight Lab — Mic, Webcam & Audio Readiness Studio',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    privacyMode: 'client-only-ephemeral',
  });
}
