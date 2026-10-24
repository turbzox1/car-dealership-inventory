import { useEffect } from 'react';

export interface ToastMessage {
  id: number;
  tone: 'success' | 'error';
  text: string;
}

/** Brief confirmation or error, announced politely to screen readers and dismissed after a few seconds. */
export function Toast({ message, onDismiss }: { message: ToastMessage | null; onDismiss(): void }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;
  const dot = message.tone === 'success' ? 'bg-teal-400' : 'bg-rose-400';

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <div
        role="status"
        aria-label="Notification"
        className="rise pointer-events-auto flex max-w-md items-center gap-3 rounded-full bg-ink-900 py-2.5 pl-4 pr-2 text-sm text-paper shadow-[0_18px_40px_-18px_rgba(27,25,21,0.6)]"
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
        <span>{message.text}</span>
        <button type="button" onClick={onDismiss} className="ml-auto rounded-full px-3 py-1 font-mono text-xs text-slate-300 transition-colors hover:bg-ink-800 hover:text-paper">
          Dismiss
        </button>
      </div>
    </div>
  );
}
