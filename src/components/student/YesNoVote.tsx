'use client';

import React, { useState } from 'react';
import { YesNoPoll } from '@/types/poll';
import { CheckCircle2, ThumbsUp, ThumbsDown, HelpCircle } from 'lucide-react';

interface YesNoVoteProps {
  poll: YesNoPoll;
  onSubmit: (choice: 'yes' | 'no' | 'maybe') => Promise<boolean>;
  disabled?: boolean;
}

export const YesNoVote: React.FC<YesNoVoteProps> = ({ poll, onSubmit, disabled }) => {
  const [submittedChoice, setSubmittedChoice] = useState<'yes' | 'no' | 'maybe' | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`vote_${poll.id}`);
      if (saved === 'yes' || saved === 'no' || saved === 'maybe') {
        setSubmittedChoice(saved);
      }
    }
  }, [poll.id]);

  const handleVote = async (choice: 'yes' | 'no' | 'maybe') => {
    if (disabled || loading) return;
    setLoading(true);
    const success = await onSubmit(choice);
    setLoading(false);
    if (success) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`vote_${poll.id}`, choice);
      }
      setSubmittedChoice(choice);
    }
  };

  if (submittedChoice) {
    const label =
      submittedChoice === 'yes'
        ? poll.yesLabel || 'Sì'
        : submittedChoice === 'no'
        ? poll.noLabel || 'No'
        : poll.maybeLabel || 'Forse';

    return (
      <div className="text-center py-10 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl animate-in fade-in zoom-in-95 duration-300">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-emerald-400">Risposta Registrata!</h3>
        <p className="text-sm text-slate-300 mt-2">
          Hai scelto: <strong className="text-white text-base font-semibold">{label}</strong>
        </p>
        <p className="text-xs text-slate-400 mt-4">
          Guarda il proiettore per vedere l&apos;esito del voto dell&apos;aula!
        </p>
        <button
          onClick={() => setSubmittedChoice(null)}
          className="mt-6 text-xs text-slate-400 hover:text-white underline cursor-pointer"
        >
          Modifica risposta
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-md mx-auto space-y-4">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => handleVote('yes')}
        className="w-full py-5 px-6 rounded-2xl font-black text-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-3 transition-all active:scale-[0.98] cursor-pointer"
      >
        <ThumbsUp className="w-6 h-6" />
        <span>{poll.yesLabel || 'Sì'}</span>
      </button>

      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => handleVote('no')}
        className="w-full py-5 px-6 rounded-2xl font-black text-lg bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 flex items-center justify-center gap-3 transition-all active:scale-[0.98] cursor-pointer"
      >
        <ThumbsDown className="w-6 h-6" />
        <span>{poll.noLabel || 'No'}</span>
      </button>

      {poll.maybeLabel && (
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => handleVote('maybe')}
          className="w-full py-4 px-6 rounded-2xl font-bold text-base bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 shadow-md flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer"
        >
          <HelpCircle className="w-5 h-5 text-amber-400" />
          <span>{poll.maybeLabel}</span>
        </button>
      )}
    </div>
  );
};
