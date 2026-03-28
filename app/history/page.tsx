'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAllSessions, deleteSession } from '@/lib/storage';
import { SessionData } from '@/lib/types';
import { getPositionLabel, getLevelOption, getPersonalityOption } from '@/lib/presets';

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [mounted, setMounted] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setSessions(getAllSessions());
    setMounted(true);
  }, []);

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setDeletingId(id);
  }

  function confirmDelete(id: string) {
    deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setDeletingId(null);
  }

  if (!mounted) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">セッション履歴</h1>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ブラウザのキャッシュ依存のため、データが削除される場合があります
        </p>
      </div>

      {/* Delete confirmation dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 mx-4 max-w-sm w-full">
            <h3 className="font-semibold text-gray-900 mb-2">セッションを削除しますか？</h3>
            <p className="text-sm text-gray-500 mb-6">この操作は元に戻せません。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => confirmDelete(deletingId)}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-sm font-medium text-white hover:bg-red-600 transition-colors"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <p className="text-gray-500 text-sm mb-4">まだ面接セッションがありません</p>
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 text-sm underline"
          >
            最初のセッションを開始する
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const { position, level, personality } = session.preset;
            const avgScore = session.feedback
              ? Math.round(
                  Object.values(session.feedback.scores).reduce((a, b) => a + b, 0) /
                    Object.values(session.feedback.scores).length
                )
              : null;

            return (
              <div
                key={session.id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
              >
                <button
                  onClick={() => router.push(`/feedback/${session.id}`)}
                  className="w-full p-5 text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          {getPositionLabel(position)}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                          {getLevelOption(level)?.label}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                          {getPersonalityOption(personality)?.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(session.createdAt).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {' · '}
                        {session.messages.length} メッセージ
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0 text-right">
                      {avgScore !== null ? (
                        <div>
                          <div
                            className={`text-xl font-bold ${
                              avgScore >= 70
                                ? 'text-green-600'
                                : avgScore >= 40
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {avgScore}
                          </div>
                          <div className="text-xs text-gray-400">/ 100</div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                          未評価
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Delete button */}
                <div className="px-5 pb-3 flex justify-end border-t border-gray-100 pt-2">
                  <button
                    onClick={(e) => handleDelete(e, session.id)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
