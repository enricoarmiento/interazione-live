'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, ArrowRight, AlertCircle } from 'lucide-react';

export default function JoinByPinPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim();
    if (cleanPin.length < 3) {
      setError('Inserisci il PIN del sondaggio');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/poll/by-code/${cleanPin}`);
      if (!res.ok) {
        throw new Error('Nessun sondaggio trovato con questo PIN');
      }
      const data = await res.json();
      router.push(`/p/${data.pollId}`);
    } catch (err: any) {
      setError(err.message || 'Errore durante la ricerca');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Partecipa al Sondaggio</h1>
          <p className="text-xs text-slate-400 mt-2">
            Inserisci il codice PIN a 6 cifre mostrato sullo schermo del relatore
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={8}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                setError(null);
              }}
              placeholder="Es. 101010"
              className="w-full text-center text-3xl font-mono tracking-widest p-4 rounded-2xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={pin.length < 3 || loading}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
              pin.length >= 3 && !loading
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 active:scale-[0.98]'
                : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
            }`}
          >
            <span>{loading ? 'Verifica in corso...' : 'Entra nel Sondaggio'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
