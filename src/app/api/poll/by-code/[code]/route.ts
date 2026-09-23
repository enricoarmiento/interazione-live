import { NextRequest, NextResponse } from 'next/server';
import { getPollByCode } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  const poll = await getPollByCode(code);

  if (!poll) {
    return NextResponse.json(
      { error: 'Codice non valido o nessun sondaggio attivo con questo PIN' },
      { status: 404, headers: NO_CACHE_HEADERS }
    );
  }

  return NextResponse.json(
    {
      pollId: poll.id,
      poll,
    },
    { headers: NO_CACHE_HEADERS }
  );
}
