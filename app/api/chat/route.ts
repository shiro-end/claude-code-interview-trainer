import { NextRequest, NextResponse } from 'next/server';
import { Position, Level, Personality } from '@/lib/types';

const MOCK_RESPONSES = [
  'はい、ご質問ありがとうございます。えっと、少し考えさせてください。前職では主にチームのサポート業務を担当していて、具体的な数字としてはお伝えしにくいんですが、日々の業務をしっかりこなしてきたと思っています。まだ経験が浅い部分もありますが、一生懸命取り組んでいます。',
  'そうですね、その点については以前の経験で似たような状況がありました。具体的には、プロジェクトの締め切りが重なったとき、優先順位をつけて対応しました。結果として期日に間に合わせることができ、上司からも評価いただきました。自分なりに工夫した点もいくつかあります。',
  'おっしゃる通りで、私もその点は重要だと考えています。これまでのキャリアを通じて、論理的に物事を整理し、ステークホルダーへの説明責任を果たすことを意識してきました。御社でもその経験を活かせると確信しています。逆に、御社ではどのようなスキルをより重視されていますか？',
];

async function mockStreamResponse(): Promise<Response> {
  const text = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < text.length; i++) {
        controller.enqueue(encoder.encode(text[i]));
        await new Promise((r) => setTimeout(r, 20));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages,
      position,
      level,
      personality,
      background,
    }: {
      messages: { role: 'user' | 'assistant'; content: string }[];
      position: Position;
      level: Level;
      personality: Personality;
      background: string;
    } = body;

    if (!messages || !position || !level || !personality) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return mockStreamResponse();
    }

    const { default: OpenAI } = await import('openai');
    const { buildCandidateSystemPrompt } = await import('@/lib/presets');

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const systemPrompt = buildCandidateSystemPrompt(position, level, personality, background ?? '');

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? '';
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
      cancel() {
        stream.controller.abort();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
