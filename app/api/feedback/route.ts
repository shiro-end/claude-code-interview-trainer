import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Message, FeedbackResult } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

【NGタイプの基準】
- "ng"    : 家族構成・出身地・宗教・国籍・性別・年齢・婚姻状況・健康状態など、採用と無関係な個人情報を聞く質問
- "leading": 答えを誘導している質問（例：「大変な仕事もできますよね？」）
- "closed" : Yes/Noしか答えられないクローズドな質問で、それが不適切な文脈で使われているもの`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText =
      response.content[0].type === 'text' ? response.content[0].text : '';

    // Strip potential markdown code fences
    const jsonText = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const feedback: FeedbackResult = JSON.parse(jsonText);

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
