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
  const tone =
    message.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900';

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <div
        role="status"
        aria-label="Notification"
        className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${tone}`}
      >
        <span>{message.text}</span>
        <button type="button" onClick={onDismiss} className="ml-auto font-medium opacity-70 hover:opacity-100">
          Dismiss
        </button>
      </div>
    </div>
  );
}
