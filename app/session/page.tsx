'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession, saveSession } from '@/lib/storage';
import { SessionData, Message } from '@/lib/types';
import ChatBubble from '@/components/ChatBubble';
import { getPositionLabel, getLevelOption, getPersonalityOption } from '@/lib/presets';
import { cn } from '@/lib/utils';

const BAR_COUNT = 16;

function MicIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
      <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
    </svg>
  );
}

function SessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('id');

  const [session, setSession] = useState<SessionData | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isEnding, setIsEnding] = useState(false);
  const [profileOpen, setProfileOpen] = useState(true);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(BAR_COUNT).fill(0));

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Voice recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef(false);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioContextRef.current?.close().catch(() => {});
    };
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      await audioContext.resume();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      isRecordingRef.current = true;
      setIsRecording(true);
      monitorAudio(analyser);
    } catch (err) {
      console.error('マイクへのアクセスが拒否されました', err);
    }
  }

  function monitorAudio(analyser: AnalyserNode) {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const SILENCE_THRESHOLD = 8;
    const SILENCE_DURATION = 3000;

    function tick() {
      if (!isRecordingRef.current) return;

      analyser.getByteFrequencyData(dataArray);

      const step = Math.floor(dataArray.length / BAR_COUNT);
      const levels = Array.from({ length: BAR_COUNT }, (_, i) => {
        const slice = dataArray.slice(i * step, (i + 1) * step);
        const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
        return avg / 255;
      });
      setAudioLevels(levels);

      const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      if (volume < SILENCE_THRESHOLD) {
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            stopRecording();
          }, SILENCE_DURATION);
        }
      } else {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    }

    tick();
  }

  async function stopRecording() {
    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      setIsRecording(false);
      setAudioLevels(Array(BAR_COUNT).fill(0));
      return;
    }

    setIsRecording(false);
    setAudioLevels(Array(BAR_COUNT).fill(0));
    setIsTranscribing(true);

    await new Promise<void>((resolve) => {
      mediaRecorder.onstop = () => resolve();
      mediaRecorder.stop();
    });

    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioContextRef.current?.close().catch(() => {});

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');

    try {
      const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.text) {
        setInput((prev) => (prev ? prev + ' ' + data.text : data.text));
        textareaRef.current?.focus();
      }
    } catch (err) {
      console.error('音声認識に失敗しました', err);
    } finally {
      setIsTranscribing(false);
    }
  }

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
          background: session.preset.background,
          sessionType: session.preset.sessionType ?? 'mid-career',
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

  const { position, level, personality, background } = session.preset;
  const positionLabel = getPositionLabel(position);
  const levelLabel = getLevelOption(level)?.label ?? level;
  const personalityLabel = getPersonalityOption(personality)?.label ?? personality;

  const voiceMode = isRecording || isTranscribing;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px - 48px)' }}>
      {/* Session info bar */}
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-2 flex items-center justify-between shadow-sm flex-shrink-0">
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

      {/* Candidate profile panel */}
      {background && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl mb-2 flex-shrink-0 overflow-hidden">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2 text-left"
          >
            <span className="text-xs font-semibold text-amber-800">候補者プロフィール</span>
            <span className="text-amber-600 text-xs">{profileOpen ? '▲ 閉じる' : '▼ 開く'}</span>
          </button>
          {profileOpen && (
            <div className="px-4 pb-3 max-h-24 overflow-y-auto">
              <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-wrap">{background}</p>
            </div>
          )}
        </div>
      )}

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
      {voiceMode ? (
        <div className="mt-3 flex-shrink-0 bg-white border-2 border-blue-400 rounded-xl px-4 py-3 shadow-sm">
          {isTranscribing ? (
            <div className="flex items-center justify-center gap-3 h-12">
              <span className="inline-flex gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span className="text-sm text-blue-600 font-medium">音声を認識中...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                {/* Wave bars */}
                <div className="flex items-end justify-center gap-0.5 h-12 flex-1">
                  {audioLevels.map((level, i) => (
                    <div
                      key={i}
                      className="w-2 bg-blue-500 rounded-full"
                      style={{
                        height: `${Math.max(3, level * 48)}px`,
                        transition: 'height 75ms ease-out',
                        opacity: 0.6 + level * 0.4,
                      }}
                    />
                  ))}
                </div>
                {/* Stop button */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <button
                    onClick={stopRecording}
                    className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-md transition-colors"
                  >
                    <div className="w-4 h-4 bg-white rounded-sm" />
                  </button>
                  <span className="text-xs text-gray-500">停止</span>
                </div>
              </div>
              <div className="flex items-center justify-center mt-2 gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-gray-400">録音中 — 無音3秒で自動停止</span>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="mt-3 flex gap-2 items-end flex-shrink-0">
          <button
            onClick={startRecording}
            disabled={isLoading}
            title="音声入力"
            className={cn(
              'flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors',
              isLoading
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
            )}
          >
            <MicIcon />
          </button>
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
      )}
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
