import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { errorName, errorMessage, deviceContext, userAgent } = body;

    // Ephemeral server-side logging without storing personal data
    console.info(`[Preflight Lab Telemetry] Client reported error: ${errorName} - ${errorMessage}`, {
      deviceContext,
      userAgent: userAgent?.slice(0, 100),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      received: true,
      status: 'logged',
      diagnosticId: `err_${Date.now().toString(36)}`,
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid payload structure' },
      { status: 400 }
    );
  }
}
