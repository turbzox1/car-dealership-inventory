/** Shared class strings so every screen uses the same controls. */

const controlBase =
  'block w-full rounded-none border bg-card text-ink-900 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 focus:ring-2';

export function controlClass(hasError = false, size: 'md' | 'sm' = 'md'): string {
  const sizing = size === 'sm' ? 'px-3 py-2.5 text-sm' : 'px-4 py-3 text-[15px]';
  return `${controlBase} ${sizing} ${
    hasError
      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100'
      : 'border-slate-300 hover:border-slate-400 focus:border-ink-900 focus:ring-ink-900/10'
  }`;
}

/** Square, uppercase buttons, as on editorial / premium retail sites. */
const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-none px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed';

// Soft grey-white with black text (13.5:1): clear main action without the glare of pure white
export const buttonPrimary = `${buttonBase} bg-[#cfcfcf] text-black hover:bg-[#e2e2e2] focus-visible:ring-[#cfcfcf] focus-visible:ring-offset-paper disabled:bg-slate-200 disabled:text-slate-500`;
export const buttonAccent = `${buttonBase} bg-accent-400 text-ink-900 hover:bg-accent-500 focus-visible:ring-accent-500`;
export const buttonOutline = `${buttonBase} border border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-paper focus-visible:ring-ink-900 disabled:border-slate-300 disabled:text-slate-400 disabled:hover:bg-transparent`;
/** For use on top of photos and dark sections. */
export const buttonLight = `${buttonBase} bg-white text-black hover:bg-white/85 focus-visible:ring-white focus-visible:ring-offset-ink-900`;
export const buttonGhost = `${buttonBase} px-3 text-slate-600 hover:text-ink-900 focus-visible:ring-ink-900`;
export const buttonDanger = `${buttonBase} bg-[#b42318] text-white hover:bg-[#912018] focus-visible:ring-rose-500 disabled:opacity-70`;

export const labelClass = 'block text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-600';
