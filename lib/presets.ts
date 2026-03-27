import { Position, Level, Personality } from './types';

export type PositionOption = {
  value: Position;
  label: string;
  defaultBackground: string;
};

export type LevelOption = {
  value: Level;
  label: string;
  description: string;
};

export type PersonalityOption = {
  value: Personality;
  label: string;
  description: string;
};

export const positions: PositionOption[] = [
  {
    value: 'sales',
    label: '営業職',
    defaultBackground:
      'SaaS系スタートアップで3年間インサイドセールスを担当。主にIT・HR領域のプロダクトを中小企業向けに提案してきた。月次目標120%達成を継続し、昨年はチームトップの成績。現在は新規開拓に加えカスタマーサクセスも兼務している。',
  },
  {
    value: 'frontend',
    label: 'フロントエンドエンジニア',
    defaultBackground:
      'Web制作会社で4年間フロントエンド開発に従事。React / TypeScriptを用いたSPAの設計・実装が主な業務。最近はNext.jsやTailwind CSSも活用し、BtoB向けダッシュボード系プロダクトを担当。チームリードとして3名のメンバーをマネジメントした経験もある。',
  },
  {
    value: 'hr',
    label: '人事',
    defaultBackground:
      '中堅メーカーの人事部で5年間勤務。採用・研修・労務の幅広い業務を経験。直近2年は新卒採用のリーダーとして年間30名規模の採用を担当。HRテックツールの導入プロジェクトにも携わり、業務効率化に貢献した。',
  },
];

export const levels: LevelOption[] = [
  {
    value: 'junior',
    label: 'ジュニア',
    description:
      '言い回しや説明がわかりにくく、要点をうまく整理して話せない。緊張して回り道をする。経験が浅く、具体的なエピソードが少ない。',
  },
  {
    value: 'middle',
    label: 'ミドル',
    description:
      '経験を踏まえた具体的な話ができる。自分の意見も持っているが、稀に曖昧な表現になることがある。',
  },
  {
    value: 'senior',
    label: 'シニア',
    description:
      '論理的・簡潔に話す。自分のキャリア観が明確。逆質問も積極的にする。',
  },
];

export const personalities: PersonalityOption[] = [
  {
    value: 'assertive',
    label: '積極的',
    description: '自分から話を広げ、アピールが強い。少し前のめり。',
  },
  {
    value: 'nervous',
    label: '緊張気味',
    description: '短い返答になりがち。確認してから話す。少し間が空く。',
  },
  {
    value: 'cautious',
    label: '慎重',
    description: '質問をよく聞き返す。断言を避け、「〜と思います」が多い。',
  },
];

export function getPositionOption(value: Position): PositionOption | undefined {
  return positions.find((p) => p.value === value);
}

export function getPositionLabel(value: Position): string {
  return getPositionOption(value)?.label ?? value;
}

export function getLevelOption(value: Level): LevelOption | undefined {
  return levels.find((l) => l.value === value);
}

export function getPersonalityOption(value: Personality): PersonalityOption | undefined {
  return personalities.find((p) => p.value === value);
}

export function buildCandidateSystemPrompt(
  position: Position,
  level: Level,
  personality: Personality,
  background: string
): string {
  const positionLabel = getPositionLabel(position);
  const levelOption = getLevelOption(level);
  const personalityOption = getPersonalityOption(personality);

  return `あなたは就職面接を受けている候補者です。以下のペルソナで一貫してロールプレイしてください。

【ポジション】${positionLabel}の候補者
【経歴・背景】${background}
【レベル】${levelOption?.label ?? level}
【特性】${levelOption?.description ?? ''}
【性格】${personalityOption?.label ?? personality}
【性格の特性】${personalityOption?.description ?? ''}

ルール：
- 面接官の質問に対して、上記ペルソナに沿って自然に回答する
- 経歴・背景の情報を会話の中で自然に活用する
- 面接官としての評価コメントや分析は一切しない
- 回答は必ず日本語で行う
- 1回の返答は3〜6文程度を目安にする
- ペルソナから外れた行動（急に流暢になるなど）はしない`;
}
