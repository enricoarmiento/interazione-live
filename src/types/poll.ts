export type PollType = 'rating' | 'text' | 'choice' | 'qna' | 'emoji' | 'yesno';

export interface BasePoll {
  id: string;
  code: string; // 6-digit PIN code for easy entry
  title: string;
  description?: string;
  type: PollType;
  isLocked?: boolean;
  hideResults?: boolean;
  createdAt: number;
}

export interface RatingPoll extends BasePoll {
  type: 'rating';
  min: number; // default 1
  max: number; // default 10
  minLabel?: string; // e.g. "Per nulla d'accordo"
  maxLabel?: string; // e.g. "Totalmente d'accordo"
}

export interface TextPoll extends BasePoll {
  type: 'text';
  maxLength?: number; // default 140
  placeholder?: string;
  allowMultipleSubmissions?: boolean;
}

export interface ChoicePoll extends BasePoll {
  type: 'choice';
  options: string[];
  correctOptionIndex?: number | null; // optional quiz mode
}

export interface QnAPoll extends BasePoll {
  type: 'qna';
  allowUpvotes?: boolean;
}

export interface EmojiPoll extends BasePoll {
  type: 'emoji';
  emojis: string[];
}

export interface YesNoPoll extends BasePoll {
  type: 'yesno';
  yesLabel?: string;
  noLabel?: string;
  maybeLabel?: string;
}

export type Poll = RatingPoll | TextPoll | ChoicePoll | QnAPoll | EmojiPoll | YesNoPoll;

export interface TextResponse {
  id: string;
  text: string;
  timestamp: number;
  highlighted?: boolean;
}

export interface QnAQuestion {
  id: string;
  text: string;
  upvotes: number;
  timestamp: number;
  answered?: boolean;
}

export interface EmojiReaction {
  id: string;
  emoji: string;
  timestamp: number;
}

export interface PollResults {
  pollId: string;
  totalVotes: number;
  lastUpdated: number;

  // Rating results
  ratingDistribution?: Record<number, number>; // rating -> count
  ratingAverage?: number;

  // Text results
  textResponses?: TextResponse[];
  wordCloud?: { text: string; value: number }[];

  // Choice results
  choiceCounts?: Record<number, number>; // optionIndex -> count
  choicePercentages?: Record<number, number>;

  // Q&A results
  qnaQuestions?: QnAQuestion[];

  // Emoji results
  emojiCounts?: Record<string, number>;
  recentEmojis?: EmojiReaction[];

  // Yes/No results
  yesCount?: number;
  noCount?: number;
  maybeCount?: number;
}

export interface PresentationSession {
  id: string;
  title: string;
  currentPollId: string | null;
  polls: Poll[];
  updatedAt: number;
}
