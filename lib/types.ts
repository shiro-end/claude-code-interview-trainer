export type SessionType = 'mid-career' | 'new-grad';
export type Position = string; // predefined values or custom free text
export type Level = 'junior' | 'middle' | 'senior';
export type Personality = 'assertive' | 'nervous' | 'cautious';

export type Preset = {
  sessionType: SessionType;
  position: Position;
  level: Level;
  personality: Personality;
  background: string;
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

export type QuestionScore = 'positive' | 'neutral' | 'negative';
export type NegativeType = 'ng' | 'leading' | 'closed';

export type QuestionEvaluation = {
  question: string;
  score: QuestionScore;
  reason?: string;
  type?: NegativeType;
  suggestion?: string;
};

export type MissedOpportunity = {
  trigger: string;
  suggestion: string;
  insight: string;
};

export type FeedbackResult = {
  scores: Record<ScoreKey, number>;
  scoreLabels: Record<ScoreKey, string>;
  questionEvaluations: QuestionEvaluation[];
  missedOpportunities: MissedOpportunity[];
  overallAdvice: string;
  summary: string;
  warning?: string;
};
