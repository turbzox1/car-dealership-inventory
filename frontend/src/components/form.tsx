import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { buttonPrimary, controlClass, labelClass } from './styles';

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
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`mt-1.5 ${controlClass(Boolean(error))}`}
        {...input}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-rose-700">
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
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`mt-1.5 ${controlClass(Boolean(error))}`}
        {...select}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}

/** Form-level error from the server, announced to screen readers. */
export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {children}
    </div>
  );
}

export function SubmitButton({ busy, busyLabel, children }: { busy: boolean; busyLabel: string; children: ReactNode }) {
  return (
    <button type="submit" disabled={busy} className={`${buttonPrimary} w-full`}>
      {busy && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper" aria-hidden="true" />
      )}
      {busy ? busyLabel : children}
    </button>
  );
}
