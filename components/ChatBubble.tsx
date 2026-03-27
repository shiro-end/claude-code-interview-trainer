import { cn } from '@/lib/utils';

type Props = {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
};

export default function ChatBubble({ role, content, timestamp }: Props) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex items-end gap-2 mb-4', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
          isUser ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'
        )}
      >
        {isUser ? '官' : '者'}
      </div>

      {/* Bubble */}
      <div className={cn('max-w-[75%]', isUser ? 'items-end' : 'items-start', 'flex flex-col')}>
        <div
          className={cn(
            'px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
            isUser
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
          )}
        >
          {content}
        </div>
        {timestamp && (
          <span className="text-xs text-gray-400 mt-1 px-1">
            {new Date(timestamp).toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>
    </div>
  );
}
