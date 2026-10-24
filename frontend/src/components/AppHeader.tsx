import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Logo } from './Logo';

function NavItem({ to, children }: { to: string; children: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
          isActive ? 'bg-ink-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

/** Top bar for signed-in pages: brand, navigation, who is signed in, sign out. */
export function AppHeader() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="order-last -mx-1 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
          <NavItem to="/">Showroom</NavItem>
          <NavItem to="/orders">My orders</NavItem>
          {isAdmin && <NavItem to="/admin/orders">All orders</NavItem>}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right md:block">
            <p className="text-sm font-medium text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
          {isAdmin && (
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
