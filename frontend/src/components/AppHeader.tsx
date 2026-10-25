import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useCart } from '../cart/useCart';
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

/** Cart button with a live count; the accessible name says the count in words. */
function CartLink() {
  const { count } = useCart();
  const label = count === 0 ? 'Cart, empty' : `Cart, ${count} ${count === 1 ? 'item' : 'items'}`;
  return (
    <NavLink
      to="/cart"
      aria-label={label}
      className={({ isActive }) =>
        `relative inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-150 ${
          isActive ? 'border-ink-900 bg-ink-900 text-paper' : 'border-slate-200 text-ink-900 hover:border-slate-300 hover:bg-slate-100'
        }`
      }
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 4h2l2.4 10.2a1.5 1.5 0 0 0 1.5 1.1h8.6a1.5 1.5 0 0 0 1.5-1.2L20.5 8H6.2" />
        <circle cx="9.5" cy="19.5" r="1.3" />
        <circle cx="17" cy="19.5" r="1.3" />
      </svg>
      {count > 0 && (
        <span
          className="absolute -right-1 -top-1 min-w-5 rounded-full bg-accent-400 px-1.5 text-center font-mono text-[11px] font-semibold leading-5 text-ink-900"
          aria-hidden="true"
        >
          {count}
        </span>
      )}
    </NavLink>
  );
}

/** Top bar for signed-in pages: brand, navigation, cart, who is signed in, sign out. */
export function AppHeader() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-8 gap-y-3 px-5 py-3.5 sm:px-8 lg:px-12">
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
            <span className="rounded-full border border-accent-400/50 bg-accent-400/10 px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider text-accent-600">
              Admin
            </span>
          )}
          <CartLink />
          <button type="button" onClick={logout} className={buttonGhost}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
