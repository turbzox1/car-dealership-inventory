import { useAuth } from '../auth/useAuth';
import { Logo } from '../components/Logo';

/** Signed-in home. The vehicle inventory is built here in the next step. */
export function DashboardPage() {
  const { user, logout } = useAuth();
  const firstName = user?.name.split(' ')[0] ?? '';

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-3">
            {user?.role === 'ADMIN' && (
              <span className="rounded-full bg-accent-400/20 px-2.5 py-0.5 text-xs font-semibold text-accent-600">
                Admin
              </span>
            )}
            <button
              type="button"
              onClick={logout}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900">Welcome, {firstName}</h1>
        <p className="mt-2 text-slate-600">The vehicle inventory will appear here.</p>
      </main>
    </div>
  );
}
