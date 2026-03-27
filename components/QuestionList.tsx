import { GoodQuestion, BadQuestion } from '@/lib/types';
import { cn } from '@/lib/utils';

const badTypeLabels: Record<string, string> = {
  ng: 'NG質問',
  leading: '誘導質問',
  closed: 'クローズド質問',
};

const badTypeColors: Record<string, string> = {
  ng: 'bg-red-100 text-red-700',
  leading: 'bg-orange-100 text-orange-700',
  closed: 'bg-yellow-100 text-yellow-700',
};

type GoodProps = { questions: GoodQuestion[] };
type BadProps = { questions: BadQuestion[] };

export function GoodQuestionList({ questions }: GoodProps) {
  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          良かった質問
        </h3>
        <p className="text-sm text-gray-500">評価された質問はありませんでした。</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
        良かった質問
      </h3>
      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={i} className="border border-green-100 bg-green-50 rounded-lg p-4">
            <div className="flex items-start gap-2 mb-1.5">
              <span className="inline-block bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5">
                Good
              </span>
              <p className="text-sm text-gray-800 font-medium">{q.question}</p>
            </div>
            <p className="text-xs text-gray-600 ml-14 leading-relaxed">{q.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BadQuestionList({ questions }: BadProps) {
  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          要修正の質問
        </h3>
        <p className="text-sm text-gray-500">問題のある質問は見つかりませんでした。</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
        要修正の質問
      </h3>
      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={i} className="border border-red-100 bg-red-50 rounded-lg p-4">
            <div className="flex items-start gap-2 mb-2">
              <span
                className={cn(
                  'inline-block text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5',
                  badTypeColors[q.type] ?? 'bg-gray-100 text-gray-700'
                )}
              >
                {badTypeLabels[q.type] ?? q.type}
              </span>
              <p className="text-sm text-gray-800 font-medium">{q.question}</p>
            </div>
            <div className="ml-[72px] space-y-1.5">
              <p className="text-xs text-red-700">
                <span className="font-medium">問題点：</span>
                {q.reason}
              </p>
              <p className="text-xs text-blue-700">
                <span className="font-medium">改善案：</span>
                {q.suggestion}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
