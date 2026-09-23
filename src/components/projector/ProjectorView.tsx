'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Poll, PollResults } from '@/types/poll';
import { RatingVisualizer } from './RatingVisualizer';
import { TextVisualizer } from './TextVisualizer';
import { ChoiceVisualizer } from './ChoiceVisualizer';
import { QnAVisualizer } from './QnAVisualizer';
import { EmojiVisualizer } from './EmojiVisualizer';
import { YesNoVisualizer } from './YesNoVisualizer';
import { QRCodeSVG } from 'qrcode.react';
import { triggerConfetti } from '@/lib/confetti';
import {
  Maximize,
  Minimize,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  X,
  QrCode,
} from 'lucide-react';
import { getStoredPolls, setActivePollId } from '@/lib/storage';

interface ProjectorViewProps {
  initialPollId: string;
}

export const ProjectorView: React.FC<ProjectorViewProps> = ({ initialPollId }) => {
  const router = useRouter();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResults | null>(null);
  const [allPolls, setAllPolls] = useState<Poll[]>([]);
  const [currentPollId, setCurrentPollId] = useState<string>(initialPollId);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isQrExpanded, setIsQrExpanded] = useState(false);
  const [hideResults, setHideResults] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
      const polls = getStoredPolls();
      setAllPolls(polls);
    }
  }, []);

  const fetchPollData = useCallback(async (pollId: string) => {
    try {
      const res = await fetch(`/api/poll/${pollId}`);
      if (res.ok) {
        const data = await res.json();
        setPoll(data.poll);
        setResults(data.results);
        setIsLocked(!!data.poll.isLocked);
        setHideResults(!!data.poll.hideResults);
      } else {
        const local = getStoredPolls().find((p) => p.id === pollId);
        if (local) {
          setPoll(local);
          await fetch(`/api/poll/${pollId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(local),
          });
          const retry = await fetch(`/api/poll/${pollId}`);
          if (retry.ok) {
            const data = await retry.json();
            setPoll(data.poll);
            setResults(data.results);
          }
        }
      }
    } catch (e) {
      console.error('Failed to poll results', e);
    }
  }, []);

  const syncGlobalActive = useCallback(async (pollId: string) => {
    try {
      setActivePollId(pollId);
      await fetch('/api/session/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activePollId: pollId }),
      });
    } catch (e) {
      console.error('Error syncing global active poll', e);
    }
  }, []);

  useEffect(() => {
    fetchPollData(currentPollId);
    syncGlobalActive(currentPollId);

    const interval = setInterval(() => {
      fetchPollData(currentPollId);
    }, 1200);

    return () => clearInterval(interval);
  }, [currentPollId, fetchPollData, syncGlobalActive]);

  const currentIndex = allPolls.findIndex((p) => p.id === currentPollId);

  const goToNextPoll = useCallback(() => {
    if (currentIndex < allPolls.length - 1) {
      const nextId = allPolls[currentIndex + 1].id;
      setCurrentPollId(nextId);
      router.push(`/projector/${nextId}`);
    }
  }, [currentIndex, allPolls, router]);

  const goToPrevPoll = useCallback(() => {
    if (currentIndex > 0) {
      const prevId = allPolls[currentIndex - 1].id;
      setCurrentPollId(prevId);
      router.push(`/projector/${prevId}`);
    }
  }, [currentIndex, allPolls, router]);

  const handleToggleLock = async () => {
    const newLocked = !isLocked;
    setIsLocked(newLocked);
    await fetch(`/api/poll/${currentPollId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isLocked: newLocked }),
    });
  };

  const handleToggleHide = async () => {
    const newHide = !hideResults;
    setHideResults(newHide);
    await fetch(`/api/poll/${currentPollId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hideResults: newHide }),
    });
  };

  const handleResetVotes = async () => {
    if (confirm('Vuoi davvero azzerare i voti di questa domanda?')) {
      const res = await fetch(`/api/poll/${currentPollId}/reset`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
      }
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        goToNextPoll();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        goToPrevPoll();
      } else if (e.key === 'f' || e.key === 'F') {
        handleToggleFullscreen();
      } else if (e.key === 'h' || e.key === 'H') {
        handleToggleHide();
      } else if (e.key === 'l' || e.key === 'L') {
        handleToggleLock();
      } else if (e.key === 'c' || e.key === 'C') {
        triggerConfetti();
      } else if (e.key === 'r' || e.key === 'R') {
        handleResetVotes();
      } else if (e.key === 'q' || e.key === 'Q') {
        setIsQrExpanded((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextPoll, goToPrevPoll, isLocked, hideResults]);

  if (!poll || !results) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-base font-bold text-slate-300">Caricamento Vista Proiettore...</p>
      </div>
    );
  }

  const studentUrl = origin ? `${origin}/p/${poll.id}` : `/p/${poll.id}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Clean Top Navigation Bar */}
      <header className="px-6 py-3.5 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
        {/* Left: Exit to Admin + Slide Navigator */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors"
            title="Torna all'elenco dei sondaggi"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Esci</span>
          </Link>

          {/* Previous / Next Poll Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
            <button
              onClick={goToPrevPoll}
              disabled={currentIndex <= 0}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                currentIndex <= 0
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-200 hover:bg-slate-700 hover:text-white'
              }`}
              title="Precedente (Freccia Sinistra)"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Precedente</span>
            </button>

            <span className="text-xs font-black text-white px-2">
              {currentIndex >= 0 ? `${currentIndex + 1} / ${allPolls.length}` : '—'}
            </span>

            <button
              onClick={goToNextPoll}
              disabled={currentIndex >= allPolls.length - 1}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                currentIndex >= allPolls.length - 1
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-200 hover:bg-slate-700 hover:text-white'
              }`}
              title="Successivo (Freccia Destra)"
            >
              <span className="hidden sm:inline">Successivo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Live Status Indicator */}
        <div className="flex items-center gap-2">
          {isLocked ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold animate-pulse">
              <Lock className="w-3.5 h-3.5" />
              <span>Voti Bloccati</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Votazioni Aperte</span>
            </div>
          )}
        </div>

        {/* Right: Simplified Controls */}
        <div className="flex items-center gap-2">
          {/* Hide/Show Results */}
          <button
            onClick={handleToggleHide}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              hideResults
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Nascondi i risultati per non influenzare gli studenti (tasto H)"
          >
            {hideResults ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="hidden md:inline">{hideResults ? 'Risultati Nascosti' : 'Nascondi'}</span>
          </button>

          {/* Lock / Unlock */}
          <button
            onClick={handleToggleLock}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              isLocked
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Blocca o sblocca la possibilità di votare (tasto L)"
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            <span className="hidden md:inline">{isLocked ? 'Sblocca' : 'Blocca'}</span>
          </button>

          {/* Confetti button */}
          <button
            onClick={triggerConfetti}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors cursor-pointer"
            title="Lancia coriandoli (tasto C)"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Reset */}
          <button
            onClick={handleResetVotes}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors cursor-pointer"
            title="Azzera voti (tasto R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-colors cursor-pointer"
            title="Schermo intero (tasto F)"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Presentation Stage */}
      <main className="flex-1 p-6 md:p-10 flex flex-col lg:flex-row gap-8 max-w-[1700px] w-full mx-auto items-stretch">
        {/* Left Side: Question Title & Visualizer */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          {/* Question Title */}
          <div className="mb-6">
            <span className="text-xs font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 inline-block mb-3">
              {poll.type === 'rating' && '⭐ Voto da 1 a 10'}
              {poll.type === 'text' && '💬 Testo Libero & Parole Chiave'}
              {poll.type === 'choice' && '📊 Scelta Multipla'}
              {poll.type === 'qna' && '❓ Domande dal Pubblico'}
              {poll.type === 'emoji' && '🔥 Reazioni in Diretta'}
              {poll.type === 'yesno' && '👍 Voto Istantaneo'}
            </span>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
              {poll.title}
            </h1>

            {poll.description && (
              <p className="mt-2 text-base sm:text-lg text-slate-400 font-medium">
                {poll.description}
              </p>
            )}
          </div>

          {/* Visualizer Container */}
          <div className="flex-1 flex flex-col justify-center">
            {hideResults ? (
              <div className="flex-1 min-h-[360px] flex flex-col items-center justify-center bg-slate-900/60 rounded-3xl border border-slate-800 p-8 text-center">
                <EyeOff className="w-16 h-16 text-slate-500 mb-3" />
                <h3 className="text-2xl font-bold text-white">Risultati Nascosti</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-sm">
                  L&apos;aula sta votando. Clicca su &quot;Svela Risultati&quot; o premi il tasto <strong className="text-white">H</strong> quando vuoi mostrare i grafici.
                </p>
                <button
                  onClick={handleToggleHide}
                  className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer"
                >
                  Svela Risultati (Tasto H)
                </button>
              </div>
            ) : (
              <>
                {poll.type === 'rating' && <RatingVisualizer poll={poll} results={results} />}
                {poll.type === 'text' && <TextVisualizer poll={poll} results={results} />}
                {poll.type === 'choice' && <ChoiceVisualizer poll={poll} results={results} />}
                {poll.type === 'qna' && <QnAVisualizer poll={poll} results={results} />}
                {poll.type === 'emoji' && <EmojiVisualizer poll={poll} results={results} />}
                {poll.type === 'yesno' && <YesNoVisualizer poll={poll} results={results} />}
              </>
            )}
          </div>
        </div>

        {/* Right Side: Ultra-Clean Projector QR Code Card */}
        <div className="lg:w-[300px] shrink-0 flex flex-col items-center justify-center">
          <div className="w-full bg-white rounded-3xl p-6 shadow-2xl text-slate-950 text-center flex flex-col items-center">
            <h3 className="text-base font-black tracking-tight mb-3">
              Inquadra per votare
            </h3>

            {/* QR Code */}
            <div
              onClick={() => setIsQrExpanded(true)}
              className="p-2 bg-white rounded-2xl cursor-pointer hover:scale-105 transition-transform"
              title="Clicca per ingrandire a tutto schermo"
            >
              <QRCodeSVG
                value={studentUrl}
                size={200}
                level="H"
                imageSettings={{
                  src: '/favicon.ico',
                  x: undefined,
                  y: undefined,
                  height: 24,
                  width: 24,
                  opacity: 1,
                  excavate: true,
                }}
              />
            </div>

            {/* Simple Instructions */}
            <div className="mt-4 pt-3 border-t border-slate-100 w-full">
              <span className="text-xs text-slate-500 font-semibold block">Oppure inserisci il PIN</span>
              <span className="text-2xl font-black font-mono tracking-widest text-blue-600 block mt-0.5">
                {poll.code}
              </span>
            </div>

            <button
              onClick={() => setIsQrExpanded(true)}
              className="mt-3 text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center justify-center gap-1 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Ingrandisci QR</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer Hotkey Legend */}
      <footer className="px-6 py-2.5 border-t border-slate-800/80 bg-slate-900/60 text-slate-400 text-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-bold text-slate-300">Scorciatoie:</span>
          <span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono">⬅️</kbd> <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono">➡️</kbd> Cambia slide</span>
          <span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono">F</kbd> Schermo Intero</span>
          <span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono">H</kbd> Nascondi/Mostra</span>
          <span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono">L</kbd> Blocca</span>
          <span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono">C</kbd> Coriandoli</span>
          <span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono">R</kbd> Azzera</span>
        </div>
        <div className="text-slate-500 font-medium">
          SlidePulse Live
        </div>
      </footer>

      {/* Fullscreen Giant QR Modal */}
      {isQrExpanded && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
          <button
            onClick={() => setIsQrExpanded(false)}
            className="absolute top-6 right-6 p-3 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center mb-6">
            <h2 className="text-4xl sm:text-5xl font-black text-white">Inquadra con il telefono</h2>
            <p className="text-base text-slate-400 mt-2">Nessuna registrazione richiesta • Voto anonimo immediato</p>
          </div>

          <div className="p-8 bg-white rounded-3xl shadow-2xl">
            <QRCodeSVG value={studentUrl} size={340} level="M" />
          </div>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">Codice PIN:</p>
            <p className="text-3xl font-mono font-black text-blue-400 tracking-widest mt-1">{poll.code}</p>
          </div>
        </div>
      )}
    </div>
  );
};
