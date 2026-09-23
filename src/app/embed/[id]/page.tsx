'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { Poll, PollResults } from '@/types/poll';
import { RatingVisualizer } from '@/components/projector/RatingVisualizer';
import { TextVisualizer } from '@/components/projector/TextVisualizer';
import { ChoiceVisualizer } from '@/components/projector/ChoiceVisualizer';
import { QnAVisualizer } from '@/components/projector/QnAVisualizer';
import { EmojiVisualizer } from '@/components/projector/EmojiVisualizer';
import { YesNoVisualizer } from '@/components/projector/YesNoVisualizer';
import { QRCodeSVG } from 'qrcode.react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PowerPointEmbedPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const pollId = resolvedParams.id;
  const searchParams = useSearchParams();
  const theme = searchParams.get('theme') || 'dark'; // 'dark' | 'light' | 'transparent'

  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResults | null>(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const fetchPollData = useCallback(async () => {
    try {
      const res = await fetch(`/api/poll/${pollId}`);
      if (res.ok) {
        const data = await res.json();
        setPoll(data.poll);
        setResults(data.results);
      }
    } catch (e) {
      console.error('Error fetching embed poll', e);
    }
  }, [pollId]);

  useEffect(() => {
    fetchPollData();
    const interval = setInterval(fetchPollData, 1200);
    return () => clearInterval(interval);
  }, [fetchPollData]);

  if (!poll || !results) {
    return (
      <div className="w-full h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
        <span className="text-xs text-slate-400 font-bold">Connessione ai risultati live...</span>
      </div>
    );
  }

  const studentUrl = origin ? `${origin}/p/${poll.id}` : `/p/${poll.id}`;

  const bgClasses =
    theme === 'light'
      ? 'bg-white text-slate-900'
      : theme === 'transparent'
      ? 'bg-transparent text-slate-100'
      : 'bg-slate-950 text-slate-100';

  return (
    <div
      className={`w-full h-screen overflow-hidden p-4 sm:p-6 flex flex-col justify-between select-none ${bgClasses}`}
    >
      {/* Question Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20 inline-block mb-1.5">
            {poll.type === 'rating' && 'Scala 1-10'}
            {poll.type === 'text' && 'Testo Libero'}
            {poll.type === 'choice' && 'Scelta Multipla'}
            {poll.type === 'qna' && 'Q&A Live'}
            {poll.type === 'emoji' && 'Emoji Pulse'}
            {poll.type === 'yesno' && 'Voto Rapido'}
          </span>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight truncate">
            {poll.title}
          </h1>
          {poll.description && (
            <p className="text-xs text-slate-400 truncate mt-0.5">{poll.description}</p>
          )}
        </div>

        {/* Compact QR Code Card for Slide */}
        <div className="shrink-0 bg-white p-2.5 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-100 text-slate-950">
          <div className="p-0.5 bg-white">
            <QRCodeSVG value={studentUrl} size={68} level="M" />
          </div>
          <div className="text-left pr-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block leading-tight">Inquadra</span>
            <span className="text-xs font-black text-slate-900 block mt-0.5">Vota ora</span>
            <span className="text-[11px] font-mono font-black text-blue-600 block mt-1">PIN: {poll.code}</span>
          </div>
        </div>
      </div>

      {/* Main Live Visualization */}
      <div className="flex-1 min-h-0 flex flex-col justify-center">
        {poll.type === 'rating' && <RatingVisualizer poll={poll} results={results} />}
        {poll.type === 'text' && <TextVisualizer poll={poll} results={results} />}
        {poll.type === 'choice' && <ChoiceVisualizer poll={poll} results={results} />}
        {poll.type === 'qna' && <QnAVisualizer poll={poll} results={results} />}
        {poll.type === 'emoji' && <EmojiVisualizer poll={poll} results={results} />}
        {poll.type === 'yesno' && <YesNoVisualizer poll={poll} results={results} />}
      </div>
    </div>
  );
}
