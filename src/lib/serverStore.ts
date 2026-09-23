import { Poll, PollResults, TextResponse, QnAQuestion, EmojiReaction } from '@/types/poll';
import { DEFAULT_POLLS } from './defaultPolls';

interface StoreData {
  polls: Map<string, Poll>;
  results: Map<string, PollResults>;
  codeMap: Map<string, string>; // code -> pollId
}

// Global declaration to preserve memory store across hot-reloads and serverless warm containers
declare global {
  // eslint-disable-next-line no-var
  var __SLIDEPULSE_STORE__: StoreData | undefined;
}

function initStore(): StoreData {
  if (!globalThis.__SLIDEPULSE_STORE__) {
    const polls = new Map<string, Poll>();
    const results = new Map<string, PollResults>();
    const codeMap = new Map<string, string>();

    // Seed with defaults
    for (const p of DEFAULT_POLLS) {
      polls.set(p.id, p);
      codeMap.set(p.code, p.id);
      results.set(p.id, createEmptyResults(p));
    }

    globalThis.__SLIDEPULSE_STORE__ = { polls, results, codeMap };
  }
  return globalThis.__SLIDEPULSE_STORE__;
}

export function createEmptyResults(poll: Poll): PollResults {
  const base: PollResults = {
    pollId: poll.id,
    totalVotes: 0,
    lastUpdated: Date.now(),
  };

  switch (poll.type) {
    case 'rating': {
      const dist: Record<number, number> = {};
      for (let i = poll.min; i <= poll.max; i++) dist[i] = 0;
      base.ratingDistribution = dist;
      base.ratingAverage = 0;
      break;
    }
    case 'text':
      base.textResponses = [];
      base.wordCloud = [];
      break;
    case 'choice': {
      const counts: Record<number, number> = {};
      const pcts: Record<number, number> = {};
      poll.options.forEach((_, idx) => {
        counts[idx] = 0;
        pcts[idx] = 0;
      });
      base.choiceCounts = counts;
      base.choicePercentages = pcts;
      break;
    }
    case 'qna':
      base.qnaQuestions = [];
      break;
    case 'emoji':
      base.emojiCounts = {};
      poll.emojis.forEach((em) => {
        if (base.emojiCounts) base.emojiCounts[em] = 0;
      });
      base.recentEmojis = [];
      break;
    case 'yesno':
      base.yesCount = 0;
      base.noCount = 0;
      base.maybeCount = 0;
      break;
  }

  return base;
}

export function getPoll(pollId: string): Poll | undefined {
  const store = initStore();
  return store.polls.get(pollId);
}

export function getPollByCode(code: string): Poll | undefined {
  const store = initStore();
  const pollId = store.codeMap.get(code.trim());
  if (!pollId) return undefined;
  return store.polls.get(pollId);
}

export function upsertPoll(poll: Poll): Poll {
  const store = initStore();
  store.polls.set(poll.id, poll);
  if (poll.code) {
    store.codeMap.set(poll.code, poll.id);
  }
  if (!store.results.has(poll.id)) {
    store.results.set(poll.id, createEmptyResults(poll));
  }
  return poll;
}

export function getPollResults(pollId: string): PollResults {
  const store = initStore();
  let res = store.results.get(pollId);
  if (!res) {
    const poll = store.polls.get(pollId);
    if (poll) {
      res = createEmptyResults(poll);
      store.results.set(pollId, res);
    } else {
      res = { pollId, totalVotes: 0, lastUpdated: Date.now() };
      store.results.set(pollId, res);
    }
  }
  return res;
}

export function resetPollResults(pollId: string): PollResults {
  const store = initStore();
  const poll = store.polls.get(pollId);
  if (!poll) return { pollId, totalVotes: 0, lastUpdated: Date.now() };

  const empty = createEmptyResults(poll);
  store.results.set(pollId, empty);
  return empty;
}

export function updatePollAction(pollId: string, updates: Partial<Poll>): Poll | null {
  const store = initStore();
  const poll = store.polls.get(pollId);
  if (!poll) return null;

  const updated = { ...poll, ...updates } as Poll;
  store.polls.set(pollId, updated);
  return updated;
}

export function recordVote(pollId: string, payload: any): { success: boolean; results: PollResults; error?: string } {
  const store = initStore();
  const poll = store.polls.get(pollId);
  if (!poll) {
    return { success: false, results: getPollResults(pollId), error: 'Sondaggio non trovato' };
  }

  if (poll.isLocked) {
    return { success: false, results: getPollResults(pollId), error: 'Le votazioni per questo sondaggio sono chiuse dal relatore' };
  }

  let results = store.results.get(pollId);
  if (!results) {
    results = createEmptyResults(poll);
    store.results.set(pollId, results);
  }

  results.lastUpdated = Date.now();

  switch (poll.type) {
    case 'rating': {
      const val = Number(payload.value);
      if (isNaN(val) || val < poll.min || val > poll.max) {
        return { success: false, results, error: 'Valore non valido' };
      }
      if (!results.ratingDistribution) results.ratingDistribution = {};
      results.ratingDistribution[val] = (results.ratingDistribution[val] || 0) + 1;
      results.totalVotes += 1;

      // Recalculate average
      let sum = 0;
      let count = 0;
      for (const [k, v] of Object.entries(results.ratingDistribution)) {
        sum += Number(k) * Number(v);
        count += Number(v);
      }
      results.ratingAverage = count > 0 ? parseFloat((sum / count).toFixed(1)) : 0;
      break;
    }

    case 'text': {
      const text = typeof payload.text === 'string' ? payload.text.trim() : '';
      if (!text) return { success: false, results, error: 'Testo vuoto' };

      if (!results.textResponses) results.textResponses = [];
      const newResponse: TextResponse = {
        id: `txt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        text: text.slice(0, poll.maxLength || 140),
        timestamp: Date.now(),
      };
      // Keep most recent first, max 200
      results.textResponses.unshift(newResponse);
      if (results.textResponses.length > 200) results.textResponses.pop();
      results.totalVotes += 1;

      // Update word cloud (simple word frequency excluding short words)
      const stopWords = new Set(['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'e', 'o', 'ma', 'se', 'che', 'non', 'si', 'è', 'sono', 'the', 'and', 'to', 'of', 'in', 'is', 'for']);
      const wordCounts = new Map<string, number>();

      for (const resp of results.textResponses) {
        const words = resp.text.toLowerCase().replace(/[^\w\sàèéìòù]/gi, '').split(/\s+/);
        for (const w of words) {
          if (w.length > 2 && !stopWords.has(w)) {
            wordCounts.set(w, (wordCounts.get(w) || 0) + 1);
          }
        }
      }

      results.wordCloud = Array.from(wordCounts.entries())
        .map(([text, value]) => ({ text, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 30);
      break;
    }

    case 'choice': {
      const optIdx = Number(payload.optionIndex);
      if (isNaN(optIdx) || optIdx < 0 || optIdx >= poll.options.length) {
        return { success: false, results, error: 'Opzione non valida' };
      }
      if (!results.choiceCounts) results.choiceCounts = {};
      results.choiceCounts[optIdx] = (results.choiceCounts[optIdx] || 0) + 1;
      results.totalVotes += 1;

      // Calculate percentages
      const pcts: Record<number, number> = {};
      for (let i = 0; i < poll.options.length; i++) {
        const c = results.choiceCounts[i] || 0;
        pcts[i] = results.totalVotes > 0 ? Math.round((c / results.totalVotes) * 100) : 0;
      }
      results.choicePercentages = pcts;
      break;
    }

    case 'qna': {
      if (!results.qnaQuestions) results.qnaQuestions = [];

      // Either submitting a new question OR upvoting an existing one
      if (payload.action === 'upvote' && payload.questionId) {
        const q = results.qnaQuestions.find((item) => item.id === payload.questionId);
        if (q) {
          q.upvotes = (q.upvotes || 0) + 1;
        }
      } else if (payload.questionText) {
        const text = payload.questionText.trim();
        if (!text) return { success: false, results, error: 'Domanda vuota' };

        const newQ: QnAQuestion = {
          id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          text: text.slice(0, 200),
          upvotes: 1,
          timestamp: Date.now(),
        };
        results.qnaQuestions.unshift(newQ);
        results.totalVotes += 1;
      }

      // Sort by upvotes descending
      results.qnaQuestions.sort((a, b) => b.upvotes - a.upvotes);
      break;
    }

    case 'emoji': {
      const emoji = payload.emoji;
      if (!emoji || !poll.emojis.includes(emoji)) {
        return { success: false, results, error: 'Emoji non valida' };
      }
      if (!results.emojiCounts) results.emojiCounts = {};
      results.emojiCounts[emoji] = (results.emojiCounts[emoji] || 0) + 1;
      results.totalVotes += 1;

      if (!results.recentEmojis) results.recentEmojis = [];
      results.recentEmojis.unshift({
        id: `em-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        emoji,
        timestamp: Date.now(),
      });
      if (results.recentEmojis.length > 30) results.recentEmojis.pop();
      break;
    }

    case 'yesno': {
      const choice = payload.choice; // 'yes' | 'no' | 'maybe'
      if (choice === 'yes') results.yesCount = (results.yesCount || 0) + 1;
      else if (choice === 'no') results.noCount = (results.noCount || 0) + 1;
      else if (choice === 'maybe') results.maybeCount = (results.maybeCount || 0) + 1;
      else return { success: false, results, error: 'Risposta non valida' };

      results.totalVotes += 1;
      break;
    }
  }

  return { success: true, results };
}
