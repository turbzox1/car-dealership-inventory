import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Logo } from './Logo';
import { buttonGhost } from './styles';

function NavItem({ to, children }: { to: string; children: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-150 ${
          isActive ? 'bg-ink-900 text-paper' : 'text-slate-600 hover:bg-slate-100 hover:text-ink-900'
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
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-5 py-3.5 sm:px-8">
        <Logo />
        <nav aria-label="Main" className="order-last -mx-1 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
          <NavItem to="/">Showroom</NavItem>
          <NavItem to="/orders">My orders</NavItem>
          {isAdmin && <NavItem to="/admin/orders">All orders</NavItem>}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right md:block">
            <p className="text-sm font-semibold text-ink-900">{user?.name}</p>
            <p className="font-mono text-[11px] text-slate-500">{user?.email}</p>
          </div>
          {isAdmin && (
            <span className="rounded-full border border-accent-400 bg-accent-300/50 px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider text-accent-600">
              Admin
            </span>
          )}
          <button type="button" onClick={logout} className={buttonGhost}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
