'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-blue-600 text-xl font-bold">面接官トレーニング</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className={cn(
              'text-sm font-medium transition-colors',
              pathname === '/'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            新規セッション
          </Link>
          <Link
            href="/history"
            className={cn(
              'text-sm font-medium transition-colors',
              pathname === '/history'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            履歴
          </Link>
        </nav>
      </div>
    </header>
  );
}
