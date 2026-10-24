/**
 * AutoVault mark: a dial that reads as both a speedometer and a vault lock.
 * Ink ring, mustard arc, needle; built from primitives so it stays crisp at 16px.
 */
export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <path d="M3.78 11.55A13 13 0 0 1 13.74 3.2" fill="none" stroke="var(--color-accent-500)" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M16 16L22.4 9.6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="16" cy="16" r="2.6" fill="currentColor" />
    </svg>
  );
}

/** Mark plus lowercase wordmark. */
export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 text-ink-900">
      <LogoMark />
      <span className="display text-[22px] leading-none">autovault</span>
    </span>
  );
}
