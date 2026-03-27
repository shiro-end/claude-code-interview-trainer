export type Position = 'sales' | 'frontend' | 'hr';
export type Level = 'junior' | 'middle' | 'senior';
export type Personality = 'assertive' | 'nervous' | 'cautious';

export type Preset = {
  position: Position;
  level: Level;
  personality: Personality;
};

export type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

export type SessionData = {
  id: string;
  createdAt: string;
  preset: Preset;
  messages: Message[];
  feedback?: FeedbackResult;
};

export type ScoreKey = 'questionQuality' | 'fairness' | 'followUp' | 'openEndedness';

export type GoodQuestion = {
  question: string;
  reason: string;
};

export type BadQuestion = {
  question: string;
  type: 'ng' | 'leading' | 'closed';
  reason: string;
  suggestion: string;
};

export type FeedbackResult = {
  scores: Record<ScoreKey, number>;
  scoreLabels: Record<ScoreKey, string>;
  goodQuestions: GoodQuestion[];
  badQuestions: BadQuestion[];
  overallAdvice: string;
  summary: string;
};
