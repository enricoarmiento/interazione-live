'use client';

import React, { useState } from 'react';
import { ChoicePoll } from '@/types/poll';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface ChoiceVoteProps {
  poll: ChoicePoll;
  onSubmit: (optionIndex: number) => Promise<boolean>;
  disabled?: boolean;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const ChoiceVote: React.FC<ChoiceVoteProps> = ({ poll, onSubmit, disabled }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`vote_${poll.id}`);
      if (saved !== null) {
        const idx = parseInt(saved, 10);
        if (!isNaN(idx) && idx >= 0 && idx < poll.options.length) {
          setSelected(idx);
          setSubmitted(true);
        }
      }
    }
  }, [poll.id, poll.options.length]);

  const handleSelect = (idx: number) => {
    if (disabled || loading) return;
    setSelected(idx);
  };

  const handleConfirm = async () => {
    if (selected === null || disabled || loading) return;
    setLoading(true);
    const success = await onSubmit(selected);
    setLoading(false);
    if (success) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`vote_${poll.id}`, String(selected));
      }
      setSubmitted(true);
    }
  };

  if (submitted) {
    const chosenText = selected !== null ? poll.options[selected] : '';
    return (
      <div className="text-center py-10 px-6 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl animate-in fade-in duration-300">
        <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-3" />
        <h3 className="text-2xl font-black text-white">Scelta Registrata!</h3>
        <p className="text-sm text-slate-300 mt-2">
          Hai votato l&apos;opzione <strong className="text-emerald-400 font-bold">{selected !== null ? OPTION_LETTERS[selected] : ''}</strong>:
        </p>
        <div className="text-base text-white font-bold bg-slate-800 p-4 rounded-2xl border border-slate-700 max-w-sm mx-auto mt-3">
          {chosenText}
        </div>
        <p className="text-xs text-slate-400 mt-4">
          Guarda lo schermo del proiettore per vedere le percentuali in diretta!
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-6 text-xs text-slate-400 hover:text-white underline cursor-pointer"
        >
          Vuoi cambiare risposta?
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-md mx-auto space-y-3">
      <div className="w-full text-center mb-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          Tocca l&apos;opzione che preferisci:
        </span>
      </div>

      {poll.options.map((option, idx) => {
        const isSelected = selected === idx;
        const letter = OPTION_LETTERS[idx] || String(idx + 1);

        return (
          <button
            key={idx}
            type="button"
            disabled={disabled || loading}
            onClick={() => handleSelect(idx)}
            className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-150 cursor-pointer flex items-center gap-4 ${
              isSelected
                ? 'bg-blue-600 text-white border-blue-400 shadow-xl shadow-blue-600/30 ring-4 ring-blue-500/20 scale-[1.01]'
                : 'bg-slate-850 hover:bg-slate-800 text-slate-100 border-slate-700/80 active:scale-98'
            } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shrink-0 ${
                isSelected
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {letter}
            </div>
            <span className="text-base font-bold leading-snug flex-1">
              {option}
            </span>
          </button>
        );
      })}

      <button
        type="button"
        disabled={selected === null || disabled || loading}
        onClick={handleConfirm}
        className={`mt-4 w-full py-4 px-6 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer ${
          selected !== null && !disabled && !loading
            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 active:scale-98'
            : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
        }`}
      >
        <span>
          {loading
            ? 'Invio in corso...'
            : selected !== null
            ? `Conferma Scelta: ${OPTION_LETTERS[selected]}`
            : 'Seleziona un\'opzione'}
        </span>
        {selected !== null && !loading && <ArrowRight className="w-5 h-5" />}
      </button>
    </div>
  );
};
