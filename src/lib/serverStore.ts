import { Redis } from '@upstash/redis';
import { Poll, PollResults, TextResponse, QnAQuestion } from '@/types/poll';
import { DEFAULT_POLLS } from './defaultPolls';

interface VoterState {
  choiceIndex?: number;
  ratingValue?: number;
  yesNoChoice?: 'yes' | 'no' | 'maybe';
  upvotedQuestions?: Record<string, boolean>;
  lastUpdated?: number;
}

interface InMemoryStore {
  polls: Map<string, Poll>;
  results: Map<string, PollResults>;
  codeMap: Map<string, string>;
  voters: Map<string, Record<string, VoterState>>; // pollId -> { [voterId]: VoterState }
  activePollId: string;
}

// Global variable to keep in-memory cache warm
declare global {
  // eslint-disable-next-line no-var
  var __SLIDEPULSE_IN_MEMORY__: InMemoryStore | undefined;
  // eslint-disable-next-line no-var
  var __SLIDEPULSE_REDIS_CLIENT__: Redis | null | undefined;
}

function getInMemoryStore(): InMemoryStore {
  if (!globalThis.__SLIDEPULSE_IN_MEMORY__) {
    const polls = new Map<string, Poll>();
    const results = new Map<string, PollResults>();
    const codeMap = new Map<string, string>();
    const voters = new Map<string, Record<string, VoterState>>();

    for (const p of DEFAULT_POLLS) {
      polls.set(p.id, p);
      codeMap.set(p.code, p.id);
      results.set(p.id, createEmptyResults(p));
      voters.set(p.id, {});
    }

    globalThis.__SLIDEPULSE_IN_MEMORY__ = {
      polls,
      results,
      codeMap,
      voters,
      activePollId: 'poll-1',
    };
  }
  return globalThis.__SLIDEPULSE_IN_MEMORY__;
}

function getRedis(): Redis | null {
  if (globalThis.__SLIDEPULSE_REDIS_CLIENT__ !== undefined) {
    return globalThis.__SLIDEPULSE_REDIS_CLIENT__;
  }

  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      const client = new Redis({ url, token });
      globalThis.__SLIDEPULSE_REDIS_CLIENT__ = client;
      return client;
    } catch (e) {
      console.warn('Failed to initialize Redis client, falling back to memory', e);
      globalThis.__SLIDEPULSE_REDIS_CLIENT__ = null;
      return null;
    }
  }

  globalThis.__SLIDEPULSE_REDIS_CLIENT__ = null;
  return null;
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

export async function getPoll(pollId: string): Promise<Poll | undefined> {
  const redis = getRedis();
  if (redis) {
    try {
      const poll = await redis.get<Poll>(`poll:${pollId}`);
      if (poll) return poll;
    } catch (e) {
      console.warn('Redis getPoll error, falling back', e);
    }
  }

  const mem = getInMemoryStore();
  const poll = mem.polls.get(pollId);
  if (poll) return poll;

  const def = DEFAULT_POLLS.find((p) => p.id === pollId);
  if (def) {
    if (redis) {
      redis.set(`poll:${def.id}`, def).catch(() => {});
      redis.set(`codemap:${def.code}`, def.id).catch(() => {});
    }
    mem.polls.set(def.id, def);
    mem.codeMap.set(def.code, def.id);
    return def;
  }

  return undefined;
}

export async function getPollByCode(code: string): Promise<Poll | undefined> {
  const cleanCode = code.trim();
  const redis = getRedis();
  if (redis) {
    try {
      const pollId = await redis.get<string>(`codemap:${cleanCode}`);
      if (pollId) {
        return await getPoll(pollId);
      }
    } catch (e) {
      console.warn('Redis getPollByCode error', e);
    }
  }

  const mem = getInMemoryStore();
  const pollId = mem.codeMap.get(cleanCode);
  if (pollId) {
    return await getPoll(pollId);
  }

  const def = DEFAULT_POLLS.find((p) => p.code === cleanCode);
  if (def) {
    return def;
  }

  return undefined;
}

export async function upsertPoll(poll: Poll): Promise<Poll> {
  const redis = getRedis();
  const mem = getInMemoryStore();

  mem.polls.set(poll.id, poll);
  if (poll.code) {
    mem.codeMap.set(poll.code, poll.id);
  }

  if (redis) {
    try {
      await redis.set(`poll:${poll.id}`, poll);
      if (poll.code) {
        await redis.set(`codemap:${poll.code}`, poll.id);
      }

      // Check if results exist in Redis, if not initialize
      const existingResults = await redis.get<PollResults>(`results:${poll.id}`);
      if (!existingResults) {
        await redis.set(`results:${poll.id}`, createEmptyResults(poll));
      }
    } catch (e) {
      console.warn('Redis upsertPoll error', e);
    }
  }

  if (!mem.results.has(poll.id)) {
    mem.results.set(poll.id, createEmptyResults(poll));
  }

  return poll;
}

export async function getPollResults(pollId: string): Promise<PollResults> {
  const redis = getRedis();
  if (redis) {
    try {
      const res = await redis.get<PollResults>(`results:${pollId}`);
      if (res) return res;
    } catch (e) {
      console.warn('Redis getPollResults error', e);
    }
  }

  const mem = getInMemoryStore();
  let res = mem.results.get(pollId);
  if (!res) {
    const poll = await getPoll(pollId);
    if (poll) {
      res = createEmptyResults(poll);
      mem.results.set(pollId, res);
      if (redis) {
        redis.set(`results:${pollId}`, res).catch(() => {});
      }
    } else {
      res = { pollId, totalVotes: 0, lastUpdated: Date.now() };
    }
  }
  return res;
}

export async function resetPollResults(pollId: string): Promise<PollResults> {
  const poll = await getPoll(pollId);
  const empty = poll ? createEmptyResults(poll) : { pollId, totalVotes: 0, lastUpdated: Date.now() };

  const redis = getRedis();
  if (redis) {
    try {
      await redis.set(`results:${pollId}`, empty);
      await redis.del(`voters:${pollId}`);
    } catch (e) {
      console.warn('Redis resetPollResults error', e);
    }
  }

  const mem = getInMemoryStore();
  mem.results.set(pollId, empty);
  mem.voters.set(pollId, {});

  return empty;
}

export async function updatePollAction(pollId: string, updates: Partial<Poll>): Promise<Poll | null> {
  const poll = await getPoll(pollId);
  if (!poll) return null;

  const updated = { ...poll, ...updates } as Poll;
  await upsertPoll(updated);
  return updated;
}

export async function getActivePollId(): Promise<string> {
  const redis = getRedis();
  if (redis) {
    try {
      const id = await redis.get<string>('active_poll_id');
      if (id) return id;
    } catch (e) {
      console.warn('Redis getActivePollId error', e);
    }
  }
  return getInMemoryStore().activePollId;
}

export async function setActivePollIdStore(pollId: string): Promise<void> {
  const mem = getInMemoryStore();
  mem.activePollId = pollId;

  const redis = getRedis();
  if (redis) {
    try {
      await redis.set('active_poll_id', pollId);
    } catch (e) {
      console.warn('Redis setActivePollId error', e);
    }
  }
}

export async function recordVote(
  pollId: string,
  payload: any
): Promise<{ success: boolean; results: PollResults; error?: string }> {
  const poll = await getPoll(pollId);
  if (!poll) {
    const current = await getPollResults(pollId);
    return { success: false, results: current, error: 'Sondaggio non trovato' };
  }

  if (poll.isLocked) {
    const current = await getPollResults(pollId);
    return {
      success: false,
      results: current,
      error: 'Le votazioni per questo sondaggio sono state chiuse dal relatore',
    };
  }

  const redis = getRedis();
  let results = await getPollResults(pollId);
  if (!results) {
    results = createEmptyResults(poll);
  }

  // Retrieve voters map for this poll
  let votersMap: Record<string, VoterState> = {};
  if (redis) {
    try {
      const storedVoters = await redis.get<Record<string, VoterState>>(`voters:${pollId}`);
      if (storedVoters && typeof storedVoters === 'object') {
        votersMap = storedVoters;
      }
    } catch (e) {
      console.warn('Redis fetch voters error', e);
    }
  } else {
    votersMap = getInMemoryStore().voters.get(pollId) || {};
  }

  const voterId = typeof payload.voterId === 'string' && payload.voterId.trim()
    ? payload.voterId.trim()
    : `anon_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const currentVoterState: VoterState = votersMap[voterId] || {};

  results.lastUpdated = Date.now();

  switch (poll.type) {
    case 'rating': {
      const val = Number(payload.value);
      if (isNaN(val) || val < poll.min || val > poll.max) {
        return { success: false, results, error: 'Valore non valido (deve essere tra 1 e 10)' };
      }

      if (!results.ratingDistribution) results.ratingDistribution = {};
      for (let i = poll.min; i <= poll.max; i++) {
        if (results.ratingDistribution[i] === undefined) results.ratingDistribution[i] = 0;
      }

      const prevRating = currentVoterState.ratingValue;
      if (prevRating !== undefined && prevRating === val) {
        // No change, same rating
      } else if (prevRating !== undefined && prevRating !== val) {
        // VOTE MODIFIED: Decrement old rating, increment new rating, totalVotes stays identical
        results.ratingDistribution[prevRating] = Math.max(0, (results.ratingDistribution[prevRating] || 1) - 1);
        results.ratingDistribution[val] = (results.ratingDistribution[val] || 0) + 1;
        currentVoterState.ratingValue = val;
      } else {
        // NEW VOTE: Increment new rating, totalVotes + 1
        results.ratingDistribution[val] = (results.ratingDistribution[val] || 0) + 1;
        results.totalVotes += 1;
        currentVoterState.ratingValue = val;
      }

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

    case 'choice': {
      const optIdx = Number(payload.optionIndex);
      if (isNaN(optIdx) || optIdx < 0 || optIdx >= poll.options.length) {
        return { success: false, results, error: 'Opzione non valida' };
      }

      if (!results.choiceCounts) results.choiceCounts = {};
      poll.options.forEach((_, i) => {
        if (results.choiceCounts![i] === undefined) results.choiceCounts![i] = 0;
      });

      const prevIdx = currentVoterState.choiceIndex;
      if (prevIdx !== undefined && prevIdx === optIdx) {
        // Already voted for this option, keep unchanged
      } else if (prevIdx !== undefined && prevIdx !== optIdx) {
        // VOTE MODIFIED: Decrement old option, increment new option, totalVotes stays identical
        results.choiceCounts[prevIdx] = Math.max(0, (results.choiceCounts[prevIdx] || 1) - 1);
        results.choiceCounts[optIdx] = (results.choiceCounts[optIdx] || 0) + 1;
        currentVoterState.choiceIndex = optIdx;
      } else {
        // NEW VOTE: Increment choice count, totalVotes + 1
        results.choiceCounts[optIdx] = (results.choiceCounts[optIdx] || 0) + 1;
        results.totalVotes += 1;
        currentVoterState.choiceIndex = optIdx;
      }

      // Recalculate percentages
      const pcts: Record<number, number> = {};
      for (let i = 0; i < poll.options.length; i++) {
        const c = results.choiceCounts[i] || 0;
        pcts[i] = results.totalVotes > 0 ? Math.round((c / results.totalVotes) * 100) : 0;
      }
      results.choicePercentages = pcts;
      break;
    }

    case 'yesno': {
      const choice = payload.choice as 'yes' | 'no' | 'maybe';
      if (choice !== 'yes' && choice !== 'no' && choice !== 'maybe') {
        return { success: false, results, error: 'Risposta non valida' };
      }

      const prevChoice = currentVoterState.yesNoChoice;
      if (prevChoice !== undefined && prevChoice === choice) {
        // Same answer
      } else if (prevChoice !== undefined && prevChoice !== choice) {
        // VOTE MODIFIED: Decrement old choice, increment new choice, totalVotes stays identical
        if (prevChoice === 'yes') results.yesCount = Math.max(0, (results.yesCount || 1) - 1);
        if (prevChoice === 'no') results.noCount = Math.max(0, (results.noCount || 1) - 1);
        if (prevChoice === 'maybe') results.maybeCount = Math.max(0, (results.maybeCount || 1) - 1);

        if (choice === 'yes') results.yesCount = (results.yesCount || 0) + 1;
        if (choice === 'no') results.noCount = (results.noCount || 0) + 1;
        if (choice === 'maybe') results.maybeCount = (results.maybeCount || 0) + 1;

        currentVoterState.yesNoChoice = choice;
      } else {
        // NEW VOTE
        if (choice === 'yes') results.yesCount = (results.yesCount || 0) + 1;
        if (choice === 'no') results.noCount = (results.noCount || 0) + 1;
        if (choice === 'maybe') results.maybeCount = (results.maybeCount || 0) + 1;

        results.totalVotes += 1;
        currentVoterState.yesNoChoice = choice;
      }
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

      results.textResponses.unshift(newResponse);
      if (results.textResponses.length > 200) results.textResponses.pop();
      results.totalVotes += 1;

      // Update word cloud
      const stopWords = new Set([
        'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una',
        'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra',
        'e', 'o', 'ma', 'se', 'che', 'non', 'si', 'è', 'sono',
        'the', 'and', 'to', 'of', 'in', 'is', 'for', 'a', 'an'
      ]);
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
        .map(([wText, value]) => ({ text: wText, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 30);
      break;
    }

    case 'qna': {
      if (!results.qnaQuestions) results.qnaQuestions = [];

      if (payload.action === 'upvote' && payload.questionId) {
        if (!currentVoterState.upvotedQuestions) currentVoterState.upvotedQuestions = {};
        const q = results.qnaQuestions.find((item) => item.id === payload.questionId);
        if (q) {
          if (currentVoterState.upvotedQuestions[payload.questionId]) {
            // Already upvoted: toggle off
            q.upvotes = Math.max(0, (q.upvotes || 1) - 1);
            delete currentVoterState.upvotedQuestions[payload.questionId];
          } else {
            // Upvote
            q.upvotes = (q.upvotes || 0) + 1;
            currentVoterState.upvotedQuestions[payload.questionId] = true;
          }
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
  }

  currentVoterState.lastUpdated = Date.now();
  votersMap[voterId] = currentVoterState;

  // Persist updated results and voters map
  if (redis) {
    try {
      await redis.set(`results:${pollId}`, results);
      await redis.set(`voters:${pollId}`, votersMap);
    } catch (e) {
      console.warn('Redis persist results/voters error', e);
    }
  }

  const mem = getInMemoryStore();
  mem.results.set(pollId, results);
  mem.voters.set(pollId, votersMap);

  return { success: true, results };
}
