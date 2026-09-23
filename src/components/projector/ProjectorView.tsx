'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Poll, PollResults } from '@/types/poll';
import { QRCodeCard } from '@/components/QRCodeCard';
import { RatingVisualizer } from './RatingVisualizer';
import { TextVisualizer } from './TextVisualizer';
import { ChoiceVisualizer } from './ChoiceVisualizer';
import { QnAVisualizer } from './QnAVisualizer';
import { EmojiVisualizer } from './EmojiVisualizer';
import { YesNoVisualizer } from './YesNoVisualizer';
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
  Settings,
  Sun,
  Moon,
  QrCode,
  X,
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
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
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

  // Fetch poll and results
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
        // If not found on server yet, check local storage and sync to server
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

  // Sync active poll globally so students on /live automatically follow
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

  // Polling loop
  useEffect(() => {
    fetchPollData(currentPollId);
    syncGlobalActive(currentPollId);

    const interval = setInterval(() => {
      fetchPollData(currentPollId);
    }, 1200);

    return () => clearInterval(interval);
  }, [currentPollId, fetchPollData, syncGlobalActive]);

  // Current index in presentation sequence
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

  // Actions
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
    if (confirm('Sei sicuro di voler azzerare tutti i voti di questo sondaggio?')) {
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

  // Keyboard Shortcuts
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
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-base font-semibold text-slate-300">Caricamento Vista Proiettore...</p>
      </div>
    );
  }

  const studentUrl = origin ? `${origin}/p/${poll.id}` : `/p/${poll.id}`;

  return (
    <div
      className={`min-h-screen flex flex-col justify-between select-none transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Top Bar for Presenter */}
      <header
        className={`px-6 py-4 flex items-center justify-between border-b backdrop-blur-md sticky top-0 z-30 ${
          theme === 'dark'
            ? 'bg-slate-900/80 border-slate-800'
            : 'bg-white/80 border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Torna al pannello admin"
          >
            <Settings className="w-3.5 h-3.5 text-blue-400" />
            <span>Pannello Admin</span>
          </Link>

          {/* Navigation Prev/Next buttons */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={goToPrevPoll}
              disabled={currentIndex <= 0}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                currentIndex <= 0
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title="Sondaggio precedente (Freccia Sinistra)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-xs font-mono font-bold px-2 text-slate-300">
              {currentIndex >= 0 ? `${currentIndex + 1}/${allPolls.length}` : '—'}
            </span>

            <button
              onClick={goToNextPoll}
              disabled={currentIndex >= allPolls.length - 1}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                currentIndex >= allPolls.length - 1
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title="Prossimo sondaggio (Freccia Destra)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Live Pulse indicator */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>LIVE</span>
          </div>

          {isLocked && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold animate-pulse">
              <Lock className="w-3 h-3" />
              <span>VOTAZIONI CHIUSE</span>
            </div>
          )}
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-2">
          {/* Confetti button */}
          <button
            onClick={triggerConfetti}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors cursor-pointer"
            title="Coriandoli celebrativi (C)"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Hide/Show Results */}
          <button
            onClick={handleToggleHide}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              hideResults
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Nascondi o mostra risultati (H)"
          >
            {hideResults ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{hideResults ? 'Risultati Nascosti' : 'Nascondi'}</span>
          </button>

          {/* Lock / Unlock */}
          <button
            onClick={handleToggleLock}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              isLocked
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Blocca o sblocca risposte (L)"
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isLocked ? 'Sblocca' : 'Blocca Voti'}</span>
          </button>

          {/* Reset */}
          <button
            onClick={handleResetVotes}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
            title="Azzera voti (R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Theme switcher */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title="Cambia tema chiaro/scuro"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition-colors cursor-pointer"
            title="A tutto schermo (F)"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Presentation Stage */}
      <main className="flex-1 p-6 md:p-10 flex flex-col lg:flex-row gap-8 max-w-[1700px] w-full mx-auto">
        {/* Left / Center: Question and Dynamic Visualizer */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          {/* Question Title */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                {poll.type === 'rating' && 'Scala da 1 a 10'}
                {poll.type === 'text' && 'Testo Libero & Word Cloud'}
                {poll.type === 'choice' && 'Scelta Multipla'}
                {poll.type === 'qna' && 'Q&A con Votazione'}
                {poll.type === 'emoji' && 'Emoji Pulse Live'}
                {poll.type === 'yesno' && 'Votazione Istantanea'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-balance">
              {poll.title}
            </h1>
            {poll.description && (
              <p className="mt-2 text-base sm:text-xl text-slate-400 font-medium">
                {poll.description}
              </p>
            )}
          </div>

          {/* Results Visualizer */}
          <div className="flex-1 flex flex-col justify-center">
            {hideResults ? (
              <div className="flex-1 min-h-[360px] flex flex-col items-center justify-center bg-slate-900/60 rounded-3xl border border-slate-800 p-8 text-center animate-pulse">
                <EyeOff className="w-16 h-16 text-slate-500 mb-4" />
                <h3 className="text-2xl font-bold text-white">Votazione in corso...</h3>
                <p className="text-sm text-slate-400 mt-2 max-w-md">
                  I risultati sono temporaneamente nascosti per non influenzare le risposte degli studenti.
                </p>
                <button
                  onClick={handleToggleHide}
                  className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer"
                >
                  Svela Risultati (H)
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

        {/* Right: High-Resolution QR Code & Join Info */}
        <div className="lg:w-[320px] shrink-0 flex flex-col items-center justify-center">
          <div className="w-full relative">
            <QRCodeCard
              url={studentUrl}
              code={poll.code}
              size={210}
              title="Scansiona per partecipare"
            />
            {/* Expand QR button */}
            <button
              onClick={() => setIsQrExpanded(true)}
              className="mt-3 w-full py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <QrCode className="w-4 h-4 text-blue-400" />
              Ingrandisci QR a tutto schermo
            </button>
          </div>
        </div>
      </main>

      {/* Footer Hotkey Legend */}
      <footer className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/40 text-slate-500 text-[11px] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <span>Scorciatoie:</span>
          <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">⬅️ ➡️ Cambia Sondaggio</span>
          <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">F Fullscreen</span>
          <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">H Nascondi Risultati</span>
          <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">L Blocca Voti</span>
          <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">C Coriandoli</span>
          <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">R Azzera Voti</span>
        </div>
        <div className="font-medium text-slate-400">
          SlidePulse • Real-Time Audience Interaction
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
            <h2 className="text-3xl sm:text-5xl font-black text-white">Inquadra con il telefono</h2>
            <p className="text-lg text-slate-400 mt-2">Nessuna registrazione richiesta • Partecipazione anonima</p>
          </div>

          <div className="p-8 bg-white rounded-3xl shadow-2xl">
            <QRCodeCard
              url={studentUrl}
              code={poll.code}
              size={360}
              compact
            />
          </div>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">Oppure vai su <span className="font-mono text-white font-bold">{origin || 'questo sito'}</span></p>
            <p className="text-slate-400 text-sm mt-1">e inserisci il PIN: <strong className="text-blue-400 text-2xl font-mono">{poll.code}</strong></p>
          </div>
        </div>
      )}
    </div>
  );
};
