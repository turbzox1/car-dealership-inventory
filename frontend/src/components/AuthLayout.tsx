import type { ReactNode } from 'react';
import { HERO_PHOTO } from './heroPhoto';
import { Logo, LogoMark } from './Logo';

/**
 * Sign-in / sign-up: a full-height photo panel with the pitch on the left and
 * the form on the right. On small screens the photo becomes a short banner.
 */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.2fr_1fr]">
      <section
        aria-label="About AutoVault"
        className="relative flex min-h-[260px] flex-col justify-between overflow-hidden bg-ink-900 p-6 text-white sm:p-10 lg:min-h-screen lg:p-14"
      >
        <img src={HERO_PHOTO.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        {/* Dark overlay keeps white text well above AA contrast over any part of the photo */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/40" aria-hidden="true" />

        <span className="relative inline-flex items-center gap-2 text-white">
          <LogoMark className="h-8 w-8" />
          <span className="display text-[22px]">autovault</span>
        </span>

        <div className="relative max-w-xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/75">Dealer showroom</p>
          <p className="display mt-4 text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
            New cars. Real stock. No surprises.
          </p>
          <p className="mt-4 max-w-md text-[17px] leading-relaxed text-white/85">
            Browse 30+ models from the brands you trust, see exactly what's on the lot, and reserve yours in a few
            clicks.
          </p>
        </div>

        <p className="relative text-[11px] text-white/65">
          Photo:{' '}
          <a href={HERO_PHOTO.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            {HERO_PHOTO.author}
          </a>{' '}
          ·{' '}
          <a href={HERO_PHOTO.licenseUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            {HERO_PHOTO.license}
          </a>
        </p>
      </section>

      <main className="flex items-center justify-center bg-white px-5 py-12 sm:px-10">
        <div className="rise w-full max-w-md">
          <div className="mb-10 hidden lg:block">
            <Logo />
          </div>
          <h1 className="display text-4xl text-ink-900">{title}</h1>
          <p className="mt-2 text-[15px] text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
