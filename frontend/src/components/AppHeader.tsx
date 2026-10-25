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
        `whitespace-nowrap border-b-2 px-1 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors sm:text-[13px] sm:tracking-[0.12em] duration-150 ${
          isActive ? 'border-ink-900 text-ink-900' : 'border-transparent text-slate-500 hover:text-ink-900'
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
        `relative inline-flex h-10 w-10 items-center justify-center border transition-colors duration-150 ${
          isActive ? 'border-ink-900 bg-ink-900 text-paper' : 'border-slate-300 text-ink-900 hover:border-ink-900'
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
          className="absolute -right-2 -top-2 min-w-5 rounded-full bg-accent-400 px-1.5 text-center text-[11px] font-bold leading-5 text-ink-900"
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
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-paper/90 backdrop-blur-md">
      <div className="page flex flex-wrap items-center gap-x-10 gap-y-2 py-4">
        <Logo />
        {/* On phones the links take their own row and wrap rather than being cut off */}
        <nav aria-label="Main" className="order-last flex w-full flex-wrap gap-x-5 gap-y-1 sm:order-none sm:w-auto sm:gap-x-6">
          <NavItem to="/">Showroom</NavItem>
          <NavItem to="/orders">My orders</NavItem>
          {isAdmin && <NavItem to="/admin/orders">All orders</NavItem>}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right md:block">
            <p className="text-sm font-semibold text-ink-900">{user?.name}</p>
            <p className="text-[12px] text-slate-500">{user?.email}</p>
          </div>
          {isAdmin && (
            <span className="bg-accent-400 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-900">
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
