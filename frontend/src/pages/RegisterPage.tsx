import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/useAuth';
import { AuthLayout } from '../components/AuthLayout';
import { FormAlert, SubmitButton, TextField } from '../components/form';

type Field = 'name' | 'email' | 'password' | 'confirm';
type Errors = Partial<Record<Field, string>>;

// Mirrors the API's rules so most mistakes are caught before a round trip
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

function validate(form: Record<Field, string>): Errors {
  const errors: Errors = {};
  if (!form.name.trim()) errors.name = 'Enter your name';
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email address';
  if (form.password.length < MIN_PASSWORD) errors.password = `Password must be at least ${MIN_PASSWORD} characters`;
  else if (form.confirm !== form.password) errors.confirm = 'Passwords do not match';
  return errors;
}

export function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState<Record<Field, string>>({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const bind = (field: Field) => ({
    value: form[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value })),
    error: errors[field],
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const next = validate(form);
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setServerError(null);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle={
        <>
          Already have one?{' '}
          <Link to="/login" className="font-medium text-ink-800 underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {serverError && <FormAlert>{serverError}</FormAlert>}
        <TextField label="Full name" autoComplete="name" {...bind('name')} />
        <TextField label="Email" type="email" autoComplete="email" {...bind('email')} />
        <TextField label="Password" type="password" autoComplete="new-password" {...bind('password')} />
        <TextField label="Confirm password" type="password" autoComplete="new-password" {...bind('confirm')} />
        <SubmitButton busy={busy} busyLabel="Creating account…">
          Create account
        </SubmitButton>
      </form>
    </AuthLayout>
  );
}
