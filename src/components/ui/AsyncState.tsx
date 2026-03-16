import { AlertTriangle, Loader2, Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

export function LoadingState({ title = '加载中', description = '正在读取最新状态...' }: { title?: string; description?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center">
      <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-300" />
      <div className="mt-4 text-base font-medium text-white">{title}</div>
      <div className="mt-1 text-sm text-slate-400">{description}</div>
    </div>
  );
}

export function ErrorState({
  title = '加载失败',
  description,
  action,
}: {
  title?: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-10 text-center">
      <AlertTriangle className="mx-auto h-8 w-8 text-red-300" />
      <div className="mt-4 text-base font-medium text-red-100">{title}</div>
      <div className="mt-1 text-sm text-red-100/80">{description}</div>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  title = '暂无数据',
  description,
}: {
  title?: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center">
      <Inbox className="mx-auto h-8 w-8 text-slate-500" />
      <div className="mt-4 text-base font-medium text-white">{title}</div>
      <div className="mt-1 text-sm text-slate-400">{description}</div>
    </div>
  );
}

export function InlineBanner({
  tone = 'default',
  children,
}: {
  tone?: 'default' | 'warning' | 'error' | 'success';
  children: ReactNode;
}) {
  const toneClass = {
    default: 'border-white/10 bg-white/5 text-slate-300',
    warning: 'border-amber-500/20 bg-amber-500/10 text-amber-100',
    error: 'border-red-500/20 bg-red-500/10 text-red-100',
    success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
  }[tone];

  return <div className={`rounded-xl border px-4 py-3 text-sm ${toneClass}`}>{children}</div>;
}
