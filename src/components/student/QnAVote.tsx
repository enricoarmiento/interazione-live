'use client';

import React, { useState } from 'react';
import { QnAPoll, QnAQuestion } from '@/types/poll';
import { ThumbsUp, Send, MessageSquarePlus, Check } from 'lucide-react';

interface QnAVoteProps {
  poll: QnAPoll;
  questions: QnAQuestion[];
  onSubmitQuestion: (text: string) => Promise<boolean>;
  onUpvoteQuestion: (questionId: string) => Promise<boolean>;
  disabled?: boolean;
}

export const QnAVote: React.FC<QnAVoteProps> = ({
  questions,
  onSubmitQuestion,
  onUpvoteQuestion,
  disabled,
}) => {
  const [newQuestion, setNewQuestion] = useState('');
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newQuestion.trim();
    if (!text || disabled || submitting) return;

    setSubmitting(true);
    const success = await onSubmitQuestion(text);
    setSubmitting(false);

    if (success) {
      setNewQuestion('');
      setSubmittedFeedback(true);
      setTimeout(() => setSubmittedFeedback(false), 3000);
    }
  };

  const handleUpvote = async (id: string) => {
    if (upvotedIds.has(id) || disabled) return;
    setUpvotedIds((prev) => new Set(prev).add(id));
    await onUpvoteQuestion(id);
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto space-y-5">
      {/* Submit Question Form */}
      <form onSubmit={handleSubmit} className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80">
        <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
          <MessageSquarePlus className="w-4 h-4 text-blue-400" />
          Fai una domanda anonima al relatore
        </label>
        <div className="relative">
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            maxLength={180}
            rows={2}
            disabled={disabled || submitting}
            placeholder="Qual è il tuo dubbio o riflessione?"
            className="w-full p-3 bg-slate-900 text-white placeholder-slate-500 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
          />
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">{newQuestion.length}/180 caratteri</span>
          <button
            type="submit"
            disabled={!newQuestion.trim() || disabled || submitting}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              newQuestion.trim() && !disabled && !submitting
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {submittedFeedback ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Send className="w-3.5 h-3.5" />}
            <span>{submittedFeedback ? 'Inviata!' : 'Invia Domanda'}</span>
          </button>
        </div>
      </form>

      {/* Questions list with upvoting */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Domande dell&apos;aula ({questions.length})</span>
          <span>Vota le più interessanti 👍</span>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-8 px-4 bg-slate-800/40 rounded-2xl border border-dashed border-slate-700/60 text-slate-400 text-xs">
            Nessuna domanda ancora inviata. Sii il primo a rompere il ghiaccio!
          </div>
        ) : (
          questions.map((q) => {
            const hasUpvoted = upvotedIds.has(q.id);
            return (
              <div
                key={q.id}
                className="p-3.5 bg-slate-800/90 rounded-2xl border border-slate-700/80 flex items-start gap-3 transition-all"
              >
                <div className="flex-1 text-sm text-slate-100 font-medium leading-relaxed">
                  {q.text}
                </div>
                <button
                  type="button"
                  disabled={hasUpvoted || disabled}
                  onClick={() => handleUpvote(q.id)}
                  className={`flex flex-col items-center justify-center min-w-[44px] py-1.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    hasUpvoted
                      ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 cursor-default'
                      : 'bg-slate-700/60 hover:bg-slate-700 border-slate-600 text-slate-300 hover:text-white active:scale-95'
                  }`}
                  title={hasUpvoted ? 'Hai già votato questa domanda' : 'Vota questa domanda'}
                >
                  <ThumbsUp className={`w-4 h-4 mb-0.5 ${hasUpvoted ? 'fill-blue-400' : ''}`} />
                  <span>{q.upvotes || 0}</span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
