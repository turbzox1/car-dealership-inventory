import { useEffect, useId, useRef, type ReactNode } from 'react';

interface DialogProps {
  title: string;
  onClose(): void;
  children: ReactNode;
  /** Tone of the title bar accent; "danger" for destructive confirmations. */
  tone?: 'default' | 'danger';
}

/**
 * Accessible modal: labelled by its title, closes on Escape or backdrop
 * click, moves focus inside on open and back to the trigger on close.
 */
export function Dialog({ title, onClose, children, tone = 'default' }: DialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  // Parents pass a new onClose each render; keep the latest without re-running the focus effect
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const first = panelRef.current?.querySelector<HTMLElement>('input, select, textarea, button:not([data-close])');
    first?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className={`h-1 ${tone === 'danger' ? 'bg-rose-500' : 'bg-accent-500'}`} />
        <div className="flex items-start justify-between gap-4 px-6 pt-5">
          <h2 id={titleId} className="font-display text-xl font-semibold text-ink-900">
            {title}
          </h2>
          <button
            type="button"
            data-close
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-6 pb-6 pt-4">{children}</div>
      </div>
    </div>
  );
}

/** Footer row with Cancel and the primary action, used by every dialog. */
export function DialogActions({
  onCancel,
  busy,
  submitLabel,
  busyLabel,
  tone = 'default',
}: {
  onCancel(): void;
  busy: boolean;
  submitLabel: string;
  busyLabel: string;
  tone?: 'default' | 'danger';
}) {
  const primary = tone === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-ink-900 hover:bg-ink-800';
  return (
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={busy}
        className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition disabled:opacity-70 ${primary}`}
      >
        {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
        {busy ? busyLabel : submitLabel}
      </button>
    </div>
  );
}
