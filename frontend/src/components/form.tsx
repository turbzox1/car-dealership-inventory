import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

/** Labelled input with an accessible error message (linked via aria-describedby). */
export function TextField({ label, error, className = '', ...input }: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`mt-1.5 block w-full rounded-lg border bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-4 ${
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100'
            : 'border-slate-300 focus:border-ink-700 focus:ring-ink-700/10'
        }`}
        {...input}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  children: ReactNode;
}

/** Labelled select with the same error treatment as TextField. */
export function SelectField({ label, error, className = '', children, ...select }: SelectFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`mt-1.5 block w-full rounded-lg border bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition focus:ring-4 ${
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100'
            : 'border-slate-300 focus:border-ink-700 focus:ring-ink-700/10'
        }`}
        {...select}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

/** Form-level error from the server, announced to screen readers. */
export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {children}
    </div>
  );
}

export function SubmitButton({ busy, busyLabel, children }: { busy: boolean; busyLabel: string; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink-900 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-400/50 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {busy && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
      )}
      {busy ? busyLabel : children}
    </button>
  );
}
