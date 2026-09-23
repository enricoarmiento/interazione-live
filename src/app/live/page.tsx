'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Radio } from 'lucide-react';

export default function StudentLiveRedirectPage() {
  const router = useRouter();
  const [statusText, setStatusText] = useState('Connessione alla sessione live in aula...');

  useEffect(() => {
    let mounted = true;

    const checkActivePoll = async () => {
      try {
        const res = await fetch('/api/session/active');
        if (res.ok) {
          const data = await res.json();
          if (data.activePollId && mounted) {
            router.replace(`/p/${data.activePollId}`);
            return;
          }
        }
      } catch (e) {
        console.error('Error finding active poll', e);
      }
      if (mounted) {
        setStatusText('In attesa che il relatore avvii il primo sondaggio...');
      }
    };

    checkActivePoll();
    const interval = setInterval(checkActivePoll, 2000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
      <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-4">
        <Radio className="w-6 h-6 animate-pulse" />
      </div>
      <h2 className="text-xl font-bold">SlidePulse Live</h2>
      <p className="text-sm text-slate-400 mt-2 max-w-sm leading-relaxed">
        {statusText}
      </p>
    </div>
  );
}
