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
  goodQuestions: [
    {
      question: 'これまでのキャリアで最も成長できた経験を教えてください。',
      reason: '候補者の内省を促す良質なオープンエンドの質問で、具体的なエピソードを引き出せています。',
    },
    {
      question: 'チームで意見が対立したとき、どのように解決しましたか？',
      reason: '行動ベースの質問として適切で、候補者のコミュニケーション能力を評価できます。',
    },
  ],
  badQuestions: [
    {
      question: '残業は問題ないですよね？',
      type: 'leading',
      reason: '「問題ない」という答えを誘導しており、候補者が本音を答えにくい状況を作っています。',
      suggestion: '「残業が発生することもありますが、仕事と生活のバランスについてどのようにお考えですか？」と聞き直すと良いでしょう。',
    },
    {
      question: '今の会社に不満はありますか？',
      type: 'closed',
      reason: 'Yes/Noで答えられるクローズドな質問で、転職動機の深掘りには不十分です。',
      suggestion: '「転職を考えたきっかけや、新しい環境に求めるものを教えてください」と言い換えましょう。',
    },
  ],
  overallAdvice:
    '全体的に候補者の経験を引き出す質問ができていますが、回答に対する深掘りがやや不足しています。候補者が具体的な数字や成果を語ったときに「具体的にはどのような成果でしたか？」と追加質問することで、より精度の高い評価ができます。また、クローズド質問はウォームアップには有効ですが、重要な場面ではオープンな形に変換する意識を持ちましょう。今後はSTAR法（状況・課題・行動・結果）を意識した質問設計を心がけるとさらに面接の質が上がるでしょう。',
  summary:
    '公平性と質問の適切さは高く評価できる一方、深掘り力とオープンな聞き方に改善の余地があります。基礎はしっかりしているため、フォローアップ質問のテクニックを磨くことで面接官としてのスキルが大きく向上するでしょう。',
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

    const conversationLog = buildConversationLog(messages);

    const prompt = `あなたは採用面接の専門コーチです。
以下の面接ログ（面接官の質問と候補者の回答）を分析し、面接官のスキルを評価してください。

【面接ログ】
${conversationLog}

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
  "goodQuestions": [
    { "question": "<質問文>", "reason": "<良い理由（1文）>" }
  ],
  "badQuestions": [
    { "question": "<質問文>", "type": "ng" | "leading" | "closed", "reason": "<問題点（1文）>", "suggestion": "<改善案（1文）>" }
  ],
  "overallAdvice": "<次回に向けた総合アドバイス（3〜5文）>",
  "summary": "<この面接セッション全体の総評（2文）>"
}

【badQuestionsの記載基準】
- 明らかに問題のある質問のみを記載する。判断が微妙・グレーな場合は記載しない。
- 問題のある質問がなければ空配列 [] を返してよい（無理に探さなくてよい）。
- 以下のような標準的な面接の質問は絶対に記載しない：
  「自己紹介してください」「これまでのご経歴を教えてください」「志望動機を聞かせてください」
  「強みと弱みを教えてください」「なぜ転職を考えているのですか」「入社後にやりたいことは何ですか」など

【NGタイプの基準】
- "ng"    : 家族構成・出身地・宗教・国籍・性別・年齢・婚姻状況・健康状態・妊娠・交際状況など、採用と無関係な個人情報を聞く質問
- "leading": 回答を明確に誘導している質問（例：「大変な仕事もできますよね？」「〜は問題ないですよね？」）
- "closed" : 本来オープンに聞くべき重要な場面で、Yes/Noしか答えられない形で聞いており、候補者の経験・考えが全く引き出せない質問（軽微なクローズド質問は対象外）`;

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
