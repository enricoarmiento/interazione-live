import { NextRequest, NextResponse } from 'next/server';

declare global {
  // eslint-disable-next-line no-var
  var __SLIDEPULSE_ACTIVE_POLL_ID__: string | undefined;
}

export async function GET() {
  const activePollId = globalThis.__SLIDEPULSE_ACTIVE_POLL_ID__ || 'poll-1';
  return NextResponse.json({ activePollId });
}

export async function POST(request: NextRequest) {
  try {
    const { activePollId } = await request.json();
    if (typeof activePollId === 'string') {
      globalThis.__SLIDEPULSE_ACTIVE_POLL_ID__ = activePollId;
    }
    return NextResponse.json({ success: true, activePollId });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
