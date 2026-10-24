import type { ReactNode } from 'react';
import { Logo } from './Logo';

// Computed once at load: rendering must stay pure
const YEAR = new Date().getFullYear();

const HIGHLIGHTS = [
  ['Live stock', 'Availability updates the moment a car is sold.'],
  ['Fair & safe', 'No double-selling, even when buyers act at once.'],
  ['One place', 'Browse, buy and manage the whole showroom.'],
] as const;

/** Split layout for the sign-in and sign-up pages; collapses to one column on small screens. */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-ink-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        {/* Soft glow behind the copy */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-ink-700/60 blur-3xl" />

        <Logo tone="light" />

        <div className="relative max-w-md">
          <p className="font-display text-4xl font-semibold leading-tight">
            Your showroom, <span className="text-accent-400">in sync</span>.
          </p>
          <p className="mt-4 text-slate-300">
            Track every vehicle on the lot, sell with confidence and keep stock accurate in real time.
          </p>
          <dl className="mt-10 space-y-5">
            {HIGHLIGHTS.map(([term, detail]) => (
              <div key={term} className="flex gap-4">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-500" aria-hidden="true" />
                <div>
                  <dt className="font-medium">{term}</dt>
                  <dd className="text-sm text-slate-400">{detail}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        <p className="relative text-xs text-slate-500">© {YEAR} AutoVault Motors</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
