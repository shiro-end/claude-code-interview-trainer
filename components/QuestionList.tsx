'use client';

import { useState } from 'react';
import { QuestionEvaluation, MissedOpportunity } from '@/lib/types';
import { cn } from '@/lib/utils';

const negativeTypeLabels: Record<string, string> = {
  ng: 'NG質問',
  leading: '誘導質問',
  closed: 'クローズド質問',
};

const negativeTypeColors: Record<string, string> = {
  ng: 'bg-red-100 text-red-700',
  leading: 'bg-orange-100 text-orange-700',
  closed: 'bg-yellow-100 text-yellow-700',
};

type QuestionEvaluationsProps = {
  evaluations: QuestionEvaluation[];
};

export function QuestionEvaluationList({ evaluations }: QuestionEvaluationsProps) {
  const [showNeutral, setShowNeutral] = useState(false);

  const positives = evaluations.filter((e) => e.score === 'positive');
  const negatives = evaluations.filter((e) => e.score === 'negative');
  const neutrals = evaluations.filter((e) => e.score === 'neutral');

  const visibleItems = showNeutral
    ? evaluations
    : evaluations.filter((e) => e.score !== 'neutral');

  if (evaluations.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">質問の個別評価</h3>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            加点 {positives.length}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
            {neutrals.length}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            減点 {negatives.length}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {visibleItems.map((item, i) => (
          <QuestionEvaluationItem key={i} item={item} />
        ))}
      </div>

      {neutrals.length > 0 && (
        <button
          onClick={() => setShowNeutral((v) => !v)}
          className="mt-3 text-xs text-gray-500 hover:text-gray-700 transition-colors w-full text-center py-1"
        >
          {showNeutral
            ? '▲ ニュートラルな質問を隠す'
            : `▼ ニュートラルな質問をすべて見る（${neutrals.length}件）`}
        </button>
      )}
    </div>
  );
}

function QuestionEvaluationItem({ item }: { item: QuestionEvaluation }) {
  const [open, setOpen] = useState(item.score !== 'neutral');

  if (item.score === 'neutral') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
        <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
        <span className="text-xs text-gray-500 truncate">{item.question}</span>
      </div>
    );
  }

  const isPositive = item.score === 'positive';

  return (
    <div
      className={cn(
        'rounded-lg border overflow-hidden',
        isPositive ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'
      )}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
      >
        <span
          className={cn(
            'w-2 h-2 rounded-full flex-shrink-0',
            isPositive ? 'bg-green-500' : 'bg-red-500'
          )}
        />
        <span className="text-sm text-gray-800 flex-1 leading-snug">{item.question}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isPositive && item.type && (
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full font-medium',
                negativeTypeColors[item.type] ?? 'bg-gray-100 text-gray-700'
              )}
            >
              {negativeTypeLabels[item.type] ?? item.type}
            </span>
          )}
          {isPositive && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              加点
            </span>
          )}
          <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-3 space-y-1.5 border-t border-current border-opacity-10">
          {item.reason && (
            <p className={cn('text-xs leading-relaxed', isPositive ? 'text-green-800' : 'text-red-800')}>
              {isPositive ? '✓ ' : '✗ '}
              {item.reason}
            </p>
          )}
          {!isPositive && item.suggestion && (
            <p className="text-xs text-blue-700 leading-relaxed">
              💡 {item.suggestion}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

type MissedOpportunitiesProps = {
  items: MissedOpportunity[];
};

export function MissedOpportunityList({ items }: MissedOpportunitiesProps) {
  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-base">🔍</span>
        もっと引き出せた場面
      </h3>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="border border-amber-200 bg-amber-50 rounded-lg p-4 space-y-2">
            <p className="text-xs text-amber-800 font-medium">{item.trigger}</p>
            <div className="space-y-1">
              <p className="text-xs text-gray-700">
                <span className="font-medium text-blue-700">こう聞けた：</span>{' '}
                「{item.suggestion}」
              </p>
              <p className="text-xs text-gray-600">
                <span className="font-medium">得られた情報：</span>{' '}
                {item.insight}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type GoodQuestionSummaryProps = {
  evaluations: QuestionEvaluation[];
};

export function GoodQuestionSummary({ evaluations }: GoodQuestionSummaryProps) {
  const positives = evaluations.filter((e) => e.score === 'positive');
  if (positives.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
        良かった質問
      </h3>
      <div className="space-y-3">
        {positives.map((item, i) => (
          <div key={i} className="border border-green-100 bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-800 font-medium mb-1">{item.question}</p>
            {item.reason && (
              <p className="text-xs text-gray-600 leading-relaxed">{item.reason}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
