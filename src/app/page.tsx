'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Play,
  Settings,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  QrCode,
  Sparkles,
  MessageSquare,
  Users,
} from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      {/* Top Navigation */}
      <header className="px-6 py-5 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-500/30">
              SP
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-white block">SlidePulse</span>
              <span className="text-[11px] text-slate-400 block -mt-1">Live Audience Interaction</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-800 flex items-center gap-2 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-blue-400" />
              <span>Pannello Relatore</span>
            </Link>

            <Link
              href="/projector"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Avvia Proiettore</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Coinvolgi centinaia di studenti in tempo reale durante le tue slide</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-white">
            Interazione Live per <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">Presentazioni PowerPoint</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Crea sondaggi dinamici, mostra il QR code direttamente nelle slide o sul proiettore e raccogli voti anonimi istantanei dagli smartphone degli studenti. <strong>Zero database, zero registrazioni, 100% in diretta.</strong>
          </p>
        </div>

        {/* Action Cards: Student Join vs Presenter Admin */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
          {/* Card 1: Student Join by PIN */}
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-5">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-white">Sei uno Studente?</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                Inquadra il QR code proiettato sullo schermo, oppure inserisci qui sotto il codice PIN a 6 cifre del sondaggio:
              </p>
            </div>

            <form onSubmit={handleJoinByPin} className="mt-6 space-y-3">
              <div className="relative">
                <input
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={8}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, ''));
                    setPinError('');
                  }}
                  placeholder="Es. 101010"
                  className="w-full text-center text-2xl font-mono tracking-widest p-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {pinError && (
                <p className="text-xs text-rose-400 text-center font-semibold">{pinError}</p>
              )}

              <button
                type="submit"
                disabled={pin.length < 3 || pinLoading}
                className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                  pin.length >= 3 && !pinLoading
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>{pinLoading ? 'Verifica...' : 'Partecipa al Sondaggio'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nessun nome richiesto • Partecipazione totalmente anonima</span>
              </div>
            </form>
          </div>

          {/* Card 2: Presenter / Admin */}
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-5">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-white">Sei il Relatore?</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                Accedi al tuo pannello di controllo per creare e gestire i sondaggi della tua presentazione, scaricare i QR code PNG e lanciare la vista proiettore.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <Link
                href="/admin"
                className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <Settings className="w-4 h-4" />
                <span>Gestisci i tuoi Sondaggi</span>
              </Link>

              <Link
                href="/projector"
                className="w-full py-3 px-6 rounded-2xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Play className="w-4 h-4 text-blue-400 fill-blue-400" />
                <span>Avvia Subito la Proiezione a Tutto Schermo</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto w-full mt-14">
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center">
            <BarChart3 className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-white">Scala 1-10 & Opzioni</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Media calcolata e istogramma in tempo reale</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center">
            <MessageSquare className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-white">Testo & Word Cloud</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Nuvola di parole e muro di risposte dinamico</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center">
            <QrCode className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-white">QR Code PowerPoint</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Salva in PNG alta risoluzione per ogni slide</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center">
            <Zap className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-white">Zero Database</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Deploy istantaneo su Vercel e GitHub</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 px-6 text-center text-xs text-slate-500">
        SlidePulse Live • Piattaforma di Interazione creata per Enrico Armiento • Pronto al deploy su Vercel
      </footer>
    </div>
  );
}
