import type { ReactNode } from 'react';
import { Logo } from './Logo';
import { SketchCar } from './SketchCar';

const TAGS = ['live stock', 'no double-selling', 'one-click buy'];

/**
 * Editorial split layout for sign-in and sign-up: the pitch with a sketched
 * car on the left, the form on a card on the right. Stacks on small screens.
 */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-[1320px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Logo />
        <span className="hidden font-mono text-xs text-slate-500 sm:block">Dealer inventory · est. 2026</span>
      </header>

      <div className="mx-auto grid max-w-[1320px] items-center gap-10 px-5 pb-16 pt-4 sm:px-8 lg:px-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:pt-10">
        <section className="rise order-2 lg:order-1" aria-label="About AutoVault">
          <span className="eyebrow">Dealer console</span>
          <p className="display mt-6 text-[2.6rem] leading-[1.02] text-ink-900 sm:text-6xl">
            Your showroom,
            <br />
            <span className="font-script text-[1.12em] font-bold tracking-normal text-accent-600">always in stock.</span>
          </p>
          <p className="mt-5 max-w-md text-[17px] leading-relaxed text-slate-500">
            Track every car on the lot, sell without ever double-booking the last one, and keep stock honest in real
            time.
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[13px] text-accent-600">
            {TAGS.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
          <SketchCar className="mt-8 w-full max-w-lg" />
        </section>

        <main className="rise order-1 lg:order-2">
          <div className="mx-auto w-full max-w-md rounded-[28px] border border-slate-200 bg-card p-7 shadow-[0_1px_0_rgba(27,25,21,0.04),0_24px_48px_-28px_rgba(27,25,21,0.25)] sm:p-9">
            <h1 className="display text-4xl text-ink-900">{title}</h1>
            <p className="mt-2 text-[15px] text-slate-500">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
