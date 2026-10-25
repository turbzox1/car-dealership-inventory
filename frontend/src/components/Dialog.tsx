import { useEffect, useId, useRef, type ReactNode } from 'react';
import { buttonDanger, buttonGhost, buttonPrimary } from './styles';

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
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="rise w-full max-w-lg overflow-hidden border border-slate-200 bg-card shadow-[0_30px_60px_-30px_rgba(27,25,21,0.5)]"
      >
        <div className="flex items-start justify-between gap-4 px-7 pt-6">
          <h2 id={titleId} className={`display text-2xl ${tone === 'danger' ? 'text-rose-800' : 'text-ink-900'}`}>
            {title}
          </h2>
          <button
            type="button"
            data-close
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink-900"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-7 pb-7 pt-4">{children}</div>
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
  const primary = tone === 'danger' ? buttonDanger : buttonPrimary;
  return (
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        className={buttonGhost}
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={busy}
        className={primary}
      >
        {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
        {busy ? busyLabel : submitLabel}
      </button>
    </div>
  );
}
