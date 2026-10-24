import { useAuth } from '../auth/useAuth';
import { Logo } from './Logo';

/** Top bar for signed-in pages: brand, who is signed in, sign out. */
export function AppHeader() {
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Logo />
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
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
  );
}
