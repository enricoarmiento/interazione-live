import { NextRequest, NextResponse } from 'next/server';
import { getActivePollId, setActivePollIdStore } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET() {
  const activePollId = await getActivePollId();
  return NextResponse.json({ activePollId }, { headers: NO_CACHE_HEADERS });
}

export async function POST(request: NextRequest) {
  try {
    const { activePollId } = await request.json();
    if (typeof activePollId === 'string') {
      await setActivePollIdStore(activePollId);
    }
    return NextResponse.json({ success: true, activePollId }, { headers: NO_CACHE_HEADERS });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
