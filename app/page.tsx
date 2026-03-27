'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { positions, levels, personalities } from '@/lib/presets';
import { Position, Level, Personality, SessionData } from '@/lib/types';
import { saveSession } from '@/lib/storage';
import { cn } from '@/lib/utils';

export default function SetupPage() {
  const router = useRouter();
  const [position, setPosition] = useState<Position | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [personality, setPersonality] = useState<Personality | null>(null);

  const canStart = position && level && personality;

  function handleStart() {
    if (!position || !level || !personality) return;
    const session: SessionData = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      preset: { position, level, personality },
      messages: [],
    };
    saveSession(session);
    router.push(`/session?id=${session.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">面接セッションの設定</h1>
        <p className="text-gray-600">候補者のプロフィールを選択して疑似面接を開始します</p>
      </div>

      <div className="space-y-6">
        {/* Position */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-3">
            <span className="inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs text-center leading-6 mr-2">1</span>
            ポジション
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {positions.map((p) => (
              <button
                key={p.value}
                onClick={() => setPosition(p.value)}
                className={cn(
                  'p-3 rounded-lg border-2 text-sm font-medium transition-all',
                  position === p.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>

        {/* Level */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-3">
            <span className="inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs text-center leading-6 mr-2">2</span>
            経験レベル
          </h2>
          <div className="space-y-2">
            {levels.map((l) => (
              <button
                key={l.value}
                onClick={() => setLevel(l.value)}
                className={cn(
                  'w-full p-4 rounded-lg border-2 text-left transition-all',
                  level === l.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                <div className={cn('font-medium text-sm mb-1', level === l.value ? 'text-blue-700' : 'text-gray-800')}>
                  {l.label}
                </div>
                <div className="text-xs text-gray-500 leading-relaxed">{l.description}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Personality */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-3">
            <span className="inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs text-center leading-6 mr-2">3</span>
            性格タイプ
          </h2>
          <div className="space-y-2">
            {personalities.map((p) => (
              <button
                key={p.value}
                onClick={() => setPersonality(p.value)}
                className={cn(
                  'w-full p-4 rounded-lg border-2 text-left transition-all',
                  personality === p.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                <div className={cn('font-medium text-sm mb-1', personality === p.value ? 'text-blue-700' : 'text-gray-800')}>
                  {p.label}
                </div>
                <div className="text-xs text-gray-500 leading-relaxed">{p.description}</div>
              </button>
            ))}
          </div>
        </section>

        <button
          onClick={handleStart}
          disabled={!canStart}
          className={cn(
            'w-full py-4 rounded-xl font-semibold text-base transition-all',
            canStart
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          面接を開始する
        </button>
      </div>
    </div>
  );
}
