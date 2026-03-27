'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSession, saveSession } from '@/lib/storage';
import { SessionData, FeedbackResult } from '@/lib/types';
import { getPositionLabel, getLevelOption, getPersonalityOption } from '@/lib/presets';
import ScoreCard from '@/components/ScoreCard';
import { GoodQuestionList, BadQuestionList } from '@/components/QuestionList';
import ChatBubble from '@/components/ChatBubble';

type Status = 'loading' | 'fetching' | 'done' | 'error';

export default function FeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    const s = getSession(sessionId);
    if (!s) {
      router.replace('/');
      return;
    }
    setSession(s);

    if (s.feedback) {
      setFeedback(s.feedback);
      setStatus('done');
      return;
    }

    if (s.messages.length === 0) {
      setStatus('done');
      return;
    }

    setStatus('fetching');
    fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: s.messages }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Feedback API error');
        return res.json();
      })
      .then((data: FeedbackResult) => {
        const updated: SessionData = { ...s, feedback: data };
        saveSession(updated);
        setSession(updated);
        setFeedback(data);
        setStatus('done');
      })
      .catch((err) => {
        console.error(err);
        setStatus('error');
      });
  }, [sessionId, router]);

  if (status === 'loading') {
    return <LoadingState message="セッションを読み込み中..." />;
  }

  if (status === 'fetching') {
    return <LoadingState message="AIがフィードバックを生成中です。しばらくお待ちください..." />;
  }

  if (status === 'error') {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 font-medium mb-4">フィードバックの生成に失敗しました</p>
        <button
          onClick={() => router.refresh()}
          className="text-sm text-blue-600 underline"
        >
          再試行
        </button>
      </div>
    );
  }

  if (!session) return null;

  const { position, level, personality } = session.preset;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">面接フィードバック</h1>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                {getPositionLabel(position)}
              </span>
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                {getLevelOption(level)?.label}
              </span>
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                {getPersonalityOption(personality)?.label}
              </span>
            </div>
          </div>
          <span className="text-xs text-gray-500">
            {new Date(session.createdAt).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      {session.messages.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <p className="text-gray-500 text-sm">会話がありませんでした。</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-blue-600 text-sm underline"
          >
            新しいセッションを開始
          </button>
        </div>
      ) : (
        <>
          {/* Feedback sections */}
          {feedback && (
            <>
              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="font-semibold text-blue-800 mb-2">総評</h3>
                <p className="text-sm text-blue-900 leading-relaxed">{feedback.summary}</p>
              </div>

              {/* Score */}
              <ScoreCard scores={feedback.scores} scoreLabels={feedback.scoreLabels} />

              {/* Good questions */}
              <GoodQuestionList questions={feedback.goodQuestions} />

              {/* Bad questions */}
              <BadQuestionList questions={feedback.badQuestions} />

              {/* Overall advice */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-semibold text-gray-800 mb-3">総合アドバイス</h3>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {feedback.overallAdvice}
                </p>
              </div>
            </>
          )}

          {/* Chat history */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4">面接ログ</h3>
            <div>
              {session.messages.map((msg, i) => (
                <ChatBubble key={i} role={msg.role} content={msg.content} timestamp={msg.timestamp} />
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex gap-3 pb-8">
        <button
          onClick={() => router.push('/')}
          className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
        >
          新しいセッションを開始
        </button>
        <button
          onClick={() => router.push('/history')}
          className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
        >
          履歴を見る
        </button>
      </div>
    </div>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
}
