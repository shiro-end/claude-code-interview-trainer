import { NextRequest, NextResponse } from 'next/server';
import { Message, FeedbackResult } from '@/lib/types';

const MOCK_FEEDBACK: FeedbackResult = {
  scores: {
    questionQuality: 72,
    fairness: 88,
    followUp: 55,
    openEndedness: 63,
  },
  scoreLabels: {
    questionQuality: '質問の質',
    fairness: '公平性・適切性',
    followUp: '深掘り力',
    openEndedness: 'オープンな聞き方',
  },
  questionEvaluations: [
    {
      question: '自己紹介をお願いします。',
      score: 'neutral',
    },
    {
      question: 'これまでのキャリアで最も成長できた経験を教えてください。',
      score: 'positive',
      reason: '候補者の内省を促すオープンな質問で、具体的なエピソードを引き出せています。',
    },
    {
      question: 'そのとき、チームの中でご自身はどんな役割を担っていたんですか？',
      score: 'positive',
      reason: '候補者の前の発言を受けて主体性の度合いを深掘りできています。',
    },
    {
      question: 'チームで意見が対立したとき、どのように解決しましたか？',
      score: 'positive',
      reason: '行動ベースの質問で、具体的な対応プロセスを引き出せています。',
    },
    {
      question: '志望動機を教えてください。',
      score: 'neutral',
    },
    {
      question: '残業は問題ないですよね？',
      score: 'negative',
      type: 'leading',
      reason: '「問題ない」という答えを誘導しており、候補者が本音を答えにくい状況を作っています。',
      suggestion: '「残業が発生することもありますが、働き方についてどのようにお考えですか？」と聞き直すと良いでしょう。',
    },
  ],
  missedOpportunities: [
    {
      trigger: '候補者が「プロジェクトをリードしました」と話した場面',
      suggestion: '「リードとは具体的にどういう役割でしたか？ご自身で意思決定していたのか、上司の方針を実行する立場だったのか、教えてもらえますか？」',
      insight: '本人の主体性の度合いが明確になり、実際の貢献範囲をより正確に把握できた',
    },
  ],
  overallAdvice:
    '全体的に候補者の経験を引き出す質問ができていますが、回答に対する深掘りがやや不足しています。候補者が具体的な成果を語ったときに「具体的にはどれくらいの規模でしたか？」と追加質問することで、より精度の高い評価ができます。今後はSTAR法（状況・課題・行動・結果）を意識した質問設計を心がけるとさらに面接の質が上がるでしょう。',
  summary:
    '公平性と質問の適切さは高く評価できる一方、深掘り力に改善の余地があります。フォローアップ質問のテクニックを磨くことで面接官としてのスキルが大きく向上するでしょう。',
};

function buildConversationLog(messages: Message[]): string {
  return messages
    .map((m) => {
      const role = m.role === 'user' ? '面接官' : '候補者';
      return `【${role}】${m.content}`;
    })
    .join('\n\n');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages }: { messages: Message[] } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      await new Promise((r) => setTimeout(r, 1500));
      return NextResponse.json(MOCK_FEEDBACK);
    }

    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const interviewerMessageCount = messages.filter((m) => m.role === 'user').length;
    const conversationLog = buildConversationLog(messages);

    const prompt = `あなたは採用面接の専門コーチです。
以下の面接ログ（面接官の質問と候補者の回答）を分析し、面接官のスキルを評価してください。

【面接ログ】
${conversationLog}

【面接官の質問数】${interviewerMessageCount}件

以下の形式でJSONのみを返してください（前後の説明不要）：

{
  "scores": {
    "questionQuality": <0-100の整数>,
    "fairness": <0-100の整数>,
    "followUp": <0-100の整数>,
    "openEndedness": <0-100の整数>
  },
  "scoreLabels": {
    "questionQuality": "質問の質",
    "fairness": "公平性・適切性",
    "followUp": "深掘り力",
    "openEndedness": "オープンな聞き方"
  },
  "questionEvaluations": [
    {
      "question": "<面接官の質問文>",
      "score": "positive" | "neutral" | "negative",
      "reason": "<positive/negativeのみ・1文>",
      "type": "<negativeのみ: ng | leading | closed>",
      "suggestion": "<negativeのみ・具体的な言い換え例・1文>"
    }
  ],
  "missedOpportunities": [
    {
      "trigger": "<候補者のどの発言・場面で深掘りの機会があったか>",
      "suggestion": "<こう聞けばよかった質問例（候補者が答えやすい具体的な言い方で）>",
      "insight": "<その質問で引き出せたはずの情報>"
    }
  ],
  "overallAdvice": "<次回に向けた総合アドバイス（3〜5文）>",
  "summary": "<この面接セッション全体の総評（2文）>",
  "warning": "<質問数が少ない場合のみ設定。それ以外はnullまたは省略>"
}

【スコアリングの注意】
- 面接官の質問が4件未満の場合、データ不足のためスコアは全体的に控えめ（最大60点程度）に評価すること
- 質問が4件未満の場合、warningに「質問数が少ないため、正確な評価が難しい場合があります」と設定すること
- 質問が4件以上の場合、warningはnullまたは省略すること

【questionEvaluationsの基準】
- 面接官の全質問を評価対象とする
- neutral の場合、reason・type・suggestion は省略する

【positiveの基準（以下のいずれかに該当し、かつ候補者が答えやすい具体的な聞き方であること）】
- 候補者の直前の発言を受けて深掘りした質問
- なぜ・どのように を問う質問（動機・意思決定プロセスを引き出す）
- 成果・影響を具体化させた質問（数字・変化・周囲への影響）
- 内省・学びを問う質問（振り返り・次回どうするか）
- 仮説・応用を問う質問（同じ状況なら・もし〜だったら）
- 思考の幅を確認する質問（他の選択肢は考えたか）
- 行動の背景にある価値観を掘る質問

【neutralの基準】
- 標準的な面接オープナー（自己紹介・志望動機・強み弱み・転職理由など）
- 単純な事実確認（在職期間・担当業務の概要など）
- 上記に該当しない、問題もなく特別に優れてもいない質問

【negativeの基準】
- 明らかに問題のある場合のみ記載する。グレーな場合は記載しない
- 問題がなければ空配列 [] を返してよい
- "ng"    : 出身地・宗教・国籍・家族構成・健康状態・妊娠・交際状況など採用と無関係な個人情報（性別・年齢は対象外。「結婚していますか？」はNG、「扶養義務はありますか？」はOK）
- "leading": 回答を明確に誘導している質問（例：「〜は問題ないですよね？」「〜できますよね？」）
- "closed" : 本来オープンに聞くべき重要な場面で、Yes/Noしか答えられず候補者の経験・考えが全く引き出せない質問

【missedOpportunitiesの基準】
- 候補者が具体的・興味深い発言をした直後に、面接官が深掘りせず別の話題に移った箇所を最大2件挙げる
- 見逃しポイントがなければ空配列 [] を返してよい
- suggestionは抽象的にならず、候補者が答えやすい具体的な言い方で書く`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2048,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = response.choices[0]?.message?.content ?? '{}';
    const feedback: FeedbackResult = JSON.parse(rawText);

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
