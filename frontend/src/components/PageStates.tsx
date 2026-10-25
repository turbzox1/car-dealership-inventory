import type { ReactNode } from 'react';
import type { ApiError } from '../api/client';
import { buttonPrimary } from './styles';

/** Skeleton rows while a list loads. */
export function LoadingRows({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-3">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-14 animate-pulse bg-slate-200/60" />
      ))}
    </div>
  );
}

/**
 * Load failure with retry. Client errors (e.g. 403) show the API's own
 * message; network and server errors get generic advice instead.
 */
export function LoadError({ what, error, onRetry }: { what: string; error: ApiError | null; onRetry(): void }) {
  const detail =
    error && error.status >= 400 && error.status < 500 ? error.message : 'Check your connection and try again.';
  return (
    <div role="alert" className="border border-rose-200 bg-rose-50/70 px-6 py-10 text-center">
      <p className="display text-xl text-rose-800">We couldn't load {what}.</p>
      <p className="mt-1.5 text-sm text-rose-700">{detail}</p>
      <button type="button" onClick={onRetry} className={`${buttonPrimary} mt-5`}>
        Try again
      </button>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="border border-dashed border-slate-300 bg-card/60 px-6 py-14 text-center">
      <p className="display text-2xl text-ink-900">{title}</p>
      {children && <div className="mt-2 text-[15px] text-slate-500">{children}</div>}
    </div>
  );
}
