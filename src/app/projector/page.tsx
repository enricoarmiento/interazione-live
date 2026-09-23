'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getActivePollId, getStoredPolls } from '@/lib/storage';

export default function ProjectorIndexPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const active = getActivePollId();
    const polls = getStoredPolls();
    const targetId = active || polls[0]?.id || 'poll-1';
    router.replace(`/projector/${targetId}`);
    setLoading(false);
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-sm font-semibold text-slate-400">Avvio Vista Proiettore...</p>
    </div>
  );
}
