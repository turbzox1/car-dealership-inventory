/** AutoVault wordmark; `tone` adapts it to dark or light backgrounds. */
export function Logo({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const text = tone === 'light' ? 'text-white' : 'text-ink-900';
  return (
    <span className={`inline-flex items-center gap-2 font-display text-xl font-semibold tracking-tight ${text}`}>
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#111833" stroke={tone === 'light' ? '#2a3566' : 'none'} />
        <path
          d="M7 19.5l2.2-5.6A2 2 0 0 1 11.1 12.6h9.8a2 2 0 0 1 1.9 1.3l2.2 5.6v4a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-1H10.5v1a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z"
          fill="#ff9f1c"
        />
        <circle cx="11" cy="19.5" r="1.4" fill="#111833" />
        <circle cx="21" cy="19.5" r="1.4" fill="#111833" />
      </svg>
      AutoVault
    </span>
  );
}
