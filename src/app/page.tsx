'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, BarChart3, Play } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');

  const handleJoinByPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pin.trim();
    if (!clean) return;
    setPinLoading(true);
    setPinError('');
    try {
      const res = await fetch(`/api/poll/by-code/${clean}`);
      if (!res.ok) {
        setPinError('PIN non valido o nessun sondaggio attivo con questo codice');
        setPinLoading(false);
        return;
      }
      const data = await res.json();
      router.push(`/p/${data.pollId}`);
    } catch {
      setPinError('Errore di connessione. Riprova.');
      setPinLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9f8] text-slate-900 flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between gap-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">SlidePulse<span className="text-blue-700">.</span></Link>
          <nav className="flex items-center gap-2 sm:gap-5 text-sm">
            <Link href="/admin" className="text-slate-600 hover:text-slate-900 transition-colors">Pannello relatore</Link>
            <Link href="/projector" className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"><Play className="w-3.5 h-3.5" /> Proiettore</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-16 sm:py-24">
        <div className="max-w-2xl mb-14">
          <p className="text-sm font-medium text-blue-700 mb-5">Interazione durante le presentazioni</p>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-[-0.045em] leading-[1.08] text-slate-950">Una domanda. Tutta l’aula partecipa.</h1>
          <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">Sondaggi e risposte in diretta, dal telefono degli studenti allo schermo della presentazione.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 max-w-4xl">
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Per chi partecipa</span>
            <h2 className="text-xl font-semibold tracking-tight mt-3">Entra nel sondaggio</h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">Inquadra il QR code mostrato in aula o inserisci il PIN.</p>
            <form onSubmit={handleJoinByPin} className="mt-7">
              <label htmlFor="poll-pin" className="block text-xs font-medium text-slate-600 mb-2">PIN del sondaggio</label>
              <div className="flex gap-2">
                <input id="poll-pin" type="text" pattern="[0-9]*" inputMode="numeric" maxLength={8} value={pin}
                  onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setPinError(''); }} placeholder="Es. 101010"
                  className="min-w-0 flex-1 h-12 px-4 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-600/25 focus:border-blue-600" />
                <button type="submit" disabled={pin.length < 3 || pinLoading} className="h-12 px-5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-medium text-sm disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2">
                  {pinLoading ? 'Verifica...' : 'Entra'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              {pinError && <p role="alert" className="text-sm text-rose-700 mt-2">{pinError}</p>}
              <p className="text-xs text-slate-500 mt-4">Partecipazione anonima, senza registrazione.</p>
            </form>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Per chi presenta</span>
            <h2 className="text-xl font-semibold tracking-tight mt-3">Prepara la sessione</h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">Crea le domande, mostra il QR code e segui le risposte in tempo reale.</p>
            <div className="mt-auto pt-8 flex flex-wrap gap-3">
              <Link href="/admin" className="h-12 px-5 rounded-lg bg-[#17212e] hover:bg-[#28384b] text-white font-medium text-sm inline-flex items-center gap-2 transition-colors"><BarChart3 className="w-4 h-4" /> Apri il pannello <ArrowRight className="w-4 h-4" /></Link>
              <Link href="/projector" className="h-12 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm inline-flex items-center transition-colors">Vista proiettore</Link>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200 py-5 px-6 text-xs text-slate-500"><div className="max-w-6xl mx-auto">SlidePulse · Interazione in diretta</div></footer>
    </div>
  );
}
