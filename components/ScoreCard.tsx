import { FeedbackResult, ScoreKey } from '@/lib/types';

type Props = {
  scores: FeedbackResult['scores'];
  scoreLabels: FeedbackResult['scoreLabels'];
};

const scoreColors: Record<string, string> = {
  high: 'bg-green-500',
  medium: 'bg-yellow-500',
  low: 'bg-red-500',
};

function getColorKey(score: number): string {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

const scoreOrder: ScoreKey[] = ['questionQuality', 'fairness', 'followUp', 'openEndedness'];

export default function ScoreCard({ scores, scoreLabels }: Props) {
  const average = Math.round(
    scoreOrder.reduce((sum, key) => sum + scores[key], 0) / scoreOrder.length
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-800 text-base">評価スコア</h3>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600">{average}</div>
          <div className="text-xs text-gray-500">総合スコア / 100</div>
        </div>
      </div>

      <div className="space-y-4">
        {scoreOrder.map((key) => {
          const score = scores[key];
          const label = scoreLabels[key];
          const colorKey = getColorKey(score);

          return (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-700 font-medium">{label}</span>
                <span
                  className={`font-bold ${
                    colorKey === 'high'
                      ? 'text-green-600'
                      : colorKey === 'medium'
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {score}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${scoreColors[colorKey]}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
