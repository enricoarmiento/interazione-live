import { NextRequest, NextResponse } from 'next/server';
import { getPollByCode } from '@/lib/serverStore';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  const poll = getPollByCode(code);

  if (!poll) {
    return NextResponse.json({ error: 'Codice non valido o nessun sondaggio attivo con questo PIN' }, { status: 404 });
  }

  return NextResponse.json({
    pollId: poll.id,
    poll,
  });
}
