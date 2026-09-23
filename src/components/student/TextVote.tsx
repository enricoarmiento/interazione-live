'use client';

import React, { useState } from 'react';
import { TextPoll } from '@/types/poll';
import { CheckCircle2, Send, PlusCircle } from 'lucide-react';

interface TextVoteProps {
  poll: TextPoll;
  onSubmit: (text: string) => Promise<boolean>;
  disabled?: boolean;
}

export const TextVote: React.FC<TextVoteProps> = ({ poll, onSubmit, disabled }) => {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [lastSubmittedText, setLastSubmittedText] = useState('');
  const [loading, setLoading] = useState(false);

  const maxLength = poll.maxLength || 140;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled || loading) return;

    setLoading(true);
    const success = await onSubmit(trimmed);
    setLoading(false);
    if (success) {
      setLastSubmittedText(trimmed);
      setText('');
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-10 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl animate-in fade-in zoom-in-95 duration-300">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-emerald-400">Risposta Inviata!</h3>
        <p className="text-sm text-slate-300 mt-2 italic bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 max-w-sm mx-auto">
          &quot;{lastSubmittedText}&quot;
        </p>
        <p className="text-xs text-slate-400 mt-4">
          La tua risposta è ora visibile in tempo reale sullo schermo di presentazione.
        </p>

        {poll.allowMultipleSubmissions !== false && (
          <button
            onClick={() => setSubmitted(false)}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-blue-400" />
            Invia un&apos;altra risposta
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full max-w-md mx-auto">
      <div className="relative w-full">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={maxLength}
          rows={3}
          disabled={disabled || loading}
          placeholder={poll.placeholder || 'Scrivi qui la tua risposta sintetica...'}
          className="w-full p-4 bg-slate-800/90 text-white placeholder-slate-500 border border-slate-700/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-base"
        />
        <div className="absolute bottom-3 right-3 text-xs text-slate-500 font-mono">
          {text.length}/{maxLength}
        </div>
      </div>

      <button
        type="submit"
        disabled={!text.trim() || disabled || loading}
        className={`mt-4 w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
          text.trim() && !disabled && !loading
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30 hover:shadow-blue-600/50 active:scale-[0.98]'
            : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
        }`}
      >
        <Send className="w-5 h-5" />
        <span>{loading ? 'Invio in corso...' : 'Invia Risposta'}</span>
      </button>
    </form>
  );
};
