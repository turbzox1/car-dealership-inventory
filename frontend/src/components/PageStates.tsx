import type { ReactNode } from 'react';
import type { ApiError } from '../api/client';

/** Skeleton rows while a list loads. */
export function LoadingRows({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-3">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200/70" />
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
    <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
      <p className="font-medium text-rose-800">We couldn't load {what}.</p>
      <p className="mt-1 text-sm text-rose-700">{detail}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
      >
        Try again
      </button>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <p className="font-display text-lg font-semibold text-ink-900">{title}</p>
      {children && <div className="mt-2 text-sm text-slate-500">{children}</div>}
    </div>
  );
}
