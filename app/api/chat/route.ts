import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildCandidateSystemPrompt } from '@/lib/presets';
import { Position, Level, Personality } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages,
      position,
      level,
      personality,
    }: {
      messages: { role: 'user' | 'assistant'; content: string }[];
      position: Position;
      level: Level;
      personality: Personality;
    } = body;

    if (!messages || !position || !level || !personality) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const systemPrompt = buildCandidateSystemPrompt(position, level, personality);

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      },
      cancel() {
        stream.abort();
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
