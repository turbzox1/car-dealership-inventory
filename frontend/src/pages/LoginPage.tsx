import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/useAuth';
import { AuthLayout } from '../components/AuthLayout';
import { FormAlert, SubmitButton, TextField } from '../components/form';

type Errors = Partial<Record<'email' | 'password', string>>;
type Role = 'customer' | 'admin';

const ROLES: { value: Role; label: string; hint: string }[] = [
  { value: 'customer', label: 'Customer', hint: 'Browse and buy' },
  { value: 'admin', label: 'Admin', hint: 'Manage the showroom' },
];

/** Two-option switch built from real radio inputs, so it works with keyboard and screen readers. */
function RolePicker({ value, onChange }: { value: Role; onChange(role: Role): void }) {
  return (
    <div role="radiogroup" aria-label="Sign in as" className="grid grid-cols-2 border border-slate-300">
      {ROLES.map((role) => (
        <label
          key={role.value}
          className={`cursor-pointer px-4 py-3 text-center transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink-900 ${
            value === role.value ? 'bg-ink-900 text-white' : 'bg-white text-ink-900 hover:bg-slate-100'
          }`}
        >
          <input
            type="radio"
            name="sign-in-role"
            value={role.value}
            checked={value === role.value}
            onChange={() => onChange(role.value)}
            className="sr-only"
          />
          <span className="block text-[13px] font-semibold uppercase tracking-[0.1em]">{role.label}</span>
          <span className={`block text-xs ${value === role.value ? 'text-white/70' : 'text-slate-500'}`}>{role.hint}</span>
        </label>
      ))}
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const [role, setRole] = useState<Role>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const next: Errors = {};
    if (!email.trim()) next.email = 'Enter your email';
    if (!password) next.password = 'Enter your password';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setServerError(null);
    try {
      // On success the route guard sends the user on to where they were going
      await login(email.trim(), password, { requireAdmin: role === 'admin' });
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle={
        role === 'customer' ? (
          <>
            New to AutoVault?{' '}
            <Link to="/register" className="font-semibold text-ink-900 underline underline-offset-4 hover:no-underline">
              Create an account
            </Link>
          </>
        ) : (
          'Admin accounts are created by the dealership.'
        )
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <RolePicker
          value={role}
          onChange={(next) => {
            setRole(next);
            setServerError(null);
          }}
        />
        {serverError && <FormAlert>{serverError}</FormAlert>}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <SubmitButton busy={busy} busyLabel="Signing in…">
          Sign in
        </SubmitButton>
      </form>
    </AuthLayout>
  );
}
