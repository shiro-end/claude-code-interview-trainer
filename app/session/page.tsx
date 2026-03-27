'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession, saveSession } from '@/lib/storage';
import { SessionData, Message } from '@/lib/types';
import ChatBubble from '@/components/ChatBubble';
import { getPositionLabel, getLevelOption, getPersonalityOption } from '@/lib/presets';
import { cn } from '@/lib/utils';

function SessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('id');

  const [session, setSession] = useState<SessionData | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isEnding, setIsEnding] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!sessionId) {
      router.replace('/');
      return;
    }
    const s = getSession(sessionId);
    if (!s) {
      router.replace('/');
      return;
    }
    setSession(s);
  }, [sessionId, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages, streamingText]);

  async function sendMessage() {
    if (!input.trim() || isLoading || !session) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedSession: SessionData = {
      ...session,
      messages: [...session.messages, userMessage],
    };
    setSession(updatedSession);
    saveSession(updatedSession);
    setInput('');
    setIsLoading(true);
    setStreamingText('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedSession.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          position: session.preset.position,
          level: session.preset.level,
          personality: session.preset.personality,
        }),
      });

      if (!res.ok) throw new Error('API error');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setStreamingText(fullText);
        }
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: fullText,
        timestamp: new Date().toISOString(),
      };

      const finalSession: SessionData = {
        ...updatedSession,
        messages: [...updatedSession.messages, assistantMessage],
      };
      setSession(finalSession);
      saveSession(finalSession);
      setStreamingText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleEndSession() {
    if (!session || isEnding) return;
    setIsEnding(true);
    saveSession(session);
    router.push(`/feedback/${session.id}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (!session) return null;

  const { position, level, personality } = session.preset;
  const positionLabel = getPositionLabel(position);
  const levelLabel = getLevelOption(level)?.label ?? level;
  const personalityLabel = getPersonalityOption(personality)?.label ?? personality;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px - 48px)' }}>
      {/* Session info bar */}
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            {positionLabel}
          </span>
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">
            {levelLabel}
          </span>
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">
            {personalityLabel}
          </span>
        </div>
        <button
          onClick={handleEndSession}
          disabled={isEnding || session.messages.length === 0}
          className={cn(
            'text-sm font-medium px-4 py-1.5 rounded-lg transition-all',
            session.messages.length === 0 || isEnding
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-red-500 text-white hover:bg-red-600'
          )}
        >
          {isEnding ? '終了中...' : '面接終了'}
        </button>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        {session.messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            質問を入力して面接を開始してください
          </div>
        )}
        {session.messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} content={msg.content} timestamp={msg.timestamp} />
        ))}
        {streamingText && (
          <ChatBubble role="assistant" content={streamingText} />
        )}
        {isLoading && !streamingText && (
          <div className="flex items-end gap-2 mb-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-bold">
              者
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm shadow-sm px-4 py-3">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="mt-4 flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="質問を入力... (Enter で送信、Shift+Enter で改行)"
          disabled={isLoading}
          rows={2}
          className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 bg-white shadow-sm"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          className={cn(
            'px-5 py-3 rounded-xl font-medium text-sm transition-all',
            input.trim() && !isLoading
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          送信
        </button>
      </div>
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense>
      <SessionContent />
    </Suspense>
  );
}
