/** Shared class strings so every screen uses the same controls. */

const controlBase =
  'block w-full rounded-xl border bg-paper/60 text-ink-900 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 focus:bg-paper focus:ring-4';

export function controlClass(hasError = false, size: 'md' | 'sm' = 'md'): string {
  const sizing = size === 'sm' ? 'px-3 py-2 text-sm' : 'px-3.5 py-2.5 text-[15px]';
  return `${controlBase} ${sizing} ${
    hasError
      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100'
      : 'border-slate-200 hover:border-slate-300 focus:border-accent-400 focus:ring-accent-400/15'
  }`;
}

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed';

export const buttonPrimary = `${buttonBase} bg-ink-900 text-paper hover:bg-ink-800 focus-visible:ring-ink-900/20 disabled:bg-slate-200 disabled:text-slate-500`;
export const buttonAccent = `${buttonBase} bg-accent-400 text-paper hover:bg-accent-300 focus-visible:ring-accent-400/40`;
export const buttonGhost = `${buttonBase} text-slate-600 hover:bg-slate-100 hover:text-ink-900 focus-visible:ring-ink-900/10`;
export const buttonDanger = `${buttonBase} bg-[#c2412f] text-white hover:bg-[#a9372a] focus-visible:ring-rose-400/30 disabled:opacity-70`;

export const labelClass = 'block text-[13px] font-semibold text-slate-600';
