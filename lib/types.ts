export type Position = 'sales' | 'frontend' | 'hr';
export type Level = 'junior' | 'middle' | 'senior';
export type Personality = 'assertive' | 'nervous' | 'cautious';

export type Preset = {
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
  reason?: string;        // positive / negative のみ
  type?: NegativeType;    // negative のみ
  suggestion?: string;    // negative のみ
};

export type MissedOpportunity = {
  trigger: string;    // 候補者の発言・場面
  suggestion: string; // こう聞けばよかった（具体的・答えやすい形）
  insight: string;    // それで何が分かったか
};

export type FeedbackResult = {
  scores: Record<ScoreKey, number>;
  scoreLabels: Record<ScoreKey, string>;
  questionEvaluations: QuestionEvaluation[];
  missedOpportunities: MissedOpportunity[];
  overallAdvice: string;
  summary: string;
  warning?: string; // 質問数が少ない場合などに設定
};
