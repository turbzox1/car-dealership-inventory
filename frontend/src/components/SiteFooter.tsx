import { Link } from 'react-router-dom';
import { LogoMark } from './Logo';

const YEAR = new Date().getFullYear();

/** Dark footer with the dealership's details, as a real showroom site would have. */
export function SiteFooter() {
  const heading = 'text-[12px] font-semibold uppercase tracking-[0.16em] text-white/60';
  const link = 'text-[15px] text-white/85 hover:text-white';
  return (
    <footer className="mt-20 bg-ink-900 text-white">
      <div className="page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="inline-flex items-center gap-2 text-white">
            <LogoMark className="h-7 w-7" />
            <span className="display text-xl">autovault</span>
          </span>
          <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-white/70">
            New cars from the brands you trust, with live stock and transparent prices.
          </p>
        </div>
        <div>
          <p className={heading}>Showroom</p>
          <ul className="mt-4 space-y-2">
            <li><Link to="/" className={link}>Inventory</Link></li>
            <li><Link to="/cart" className={link}>Your cart</Link></li>
            <li><Link to="/orders" className={link}>My orders</Link></li>
          </ul>
        </div>
        <div>
          <p className={heading}>Visit us</p>
          <address className="mt-4 space-y-1 text-[15px] not-italic text-white/85">
            <p>1200 Motor Avenue</p>
            <p>Springfield, IL 62701</p>
            <p>(555) 010-2026</p>
          </address>
        </div>
        <div>
          <p className={heading}>Hours</p>
          <ul className="mt-4 space-y-1 text-[15px] text-white/85">
            <li>Mon–Fri · 9am – 8pm</li>
            <li>Saturday · 9am – 6pm</li>
            <li>Sunday · 11am – 5pm</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="page py-5 text-[12px] text-white/60">
          © {YEAR} AutoVault Motors · Demo project · Vehicle photos from Wikimedia Commons, credited on each vehicle page.
        </p>
      </div>
    </footer>
  );
}
