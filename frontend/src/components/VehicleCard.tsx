import { Link } from 'react-router-dom';
import { formatPrice, stockLabel } from '../format';
import { CATEGORY_LABELS, type Vehicle } from '../types';
import { buttonOutline, buttonPrimary } from './styles';
import { VehicleCover } from './VehiclePhoto';

function stockDot(quantity: number): string {
  if (quantity === 0) return 'bg-slate-300';
  if (quantity <= 2) return 'bg-accent-500';
  return 'bg-teal-500';
}

/** "2025 · Hybrid · Automatic", skipping anything unknown. */
function specLine(vehicle: Vehicle): string {
  return [vehicle.year, vehicle.fuelType, vehicle.transmission].filter(Boolean).join(' · ');
}

export interface AdminActions {
  onEdit(vehicle: Vehicle): void;
  onRestock(vehicle: Vehicle): void;
  onDelete(vehicle: Vehicle): void;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  buying: boolean;
  onPurchase(vehicle: Vehicle): void;
  /** Units of this vehicle already in the cart. */
  inCart: number;
  onAddToCart(vehicle: Vehicle): void;
  /** Only passed for admins; the controls aren't rendered otherwise. */
  admin?: AdminActions;
}

const adminButton =
  'px-2 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] underline-offset-4 transition-colors duration-150 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900';

export function VehicleCard({ vehicle, buying, onPurchase, inCart, onAddToCart, admin }: VehicleCardProps) {
  const name = `${vehicle.make} ${vehicle.model}`;
  const soldOut = vehicle.quantity === 0;
  const allInCart = !soldOut && inCart >= vehicle.quantity;
  const details = specLine(vehicle);
  const href = `/vehicles/${vehicle.id}`;

  return (
    <article aria-label={name} className="group flex flex-col bg-card">
      <Link to={href} tabIndex={-1} aria-hidden="true" className="relative block overflow-hidden bg-slate-100">
        <VehicleCover
          vehicle={vehicle}
          className="aspect-[4/3] w-full transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
        />
        <span className="absolute left-3 top-3 bg-black/75 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
          {CATEGORY_LABELS[vehicle.category]}
        </span>
        {soldOut && (
          <span className="absolute right-3 top-3 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-black">
            Sold out
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">{vehicle.make}</p>
            <h3 className="display mt-1 text-[22px] leading-tight text-ink-900">
              <Link to={href} aria-label={name} className="hover:underline hover:underline-offset-4">
                {vehicle.model}
              </Link>
            </h3>
            {details && <p className="mt-1 text-sm text-slate-500">{details}</p>}
          </div>
          <p className="display shrink-0 text-[22px] leading-tight text-ink-900">{formatPrice(vehicle.price)}</p>
        </div>

        <p className="mt-3 inline-flex items-center gap-2 text-[13px] text-slate-600">
          <span className={`h-2 w-2 rounded-full ${stockDot(vehicle.quantity)}`} aria-hidden="true" />
          {stockLabel(vehicle.quantity)}
          {inCart > 0 && <span className="text-accent-600">· {inCart} in your cart</span>}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" disabled={soldOut || allInCart} onClick={() => onAddToCart(vehicle)} className={buttonPrimary}>
            {allInCart ? 'All in cart' : 'Add to cart'}
          </button>
          {/* Buy this one car straight away (the assignment's Purchase button) */}
          <button type="button" disabled={soldOut || buying} onClick={() => onPurchase(vehicle)} className={buttonOutline}>
            {buying && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" aria-hidden="true" />
            )}
            {buying ? 'Buying…' : 'Purchase'}
          </button>
        </div>

        {admin && (
          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2">
            <button type="button" aria-label={`Restock ${name}`} onClick={() => admin.onRestock(vehicle)} className={`${adminButton} text-teal-700`}>
              + Restock
            </button>
            <div className="flex">
              <button type="button" aria-label={`Edit ${name}`} onClick={() => admin.onEdit(vehicle)} className={`${adminButton} text-slate-600`}>
                Edit
              </button>
              <button type="button" aria-label={`Delete ${name}`} onClick={() => admin.onDelete(vehicle)} className={`${adminButton} text-rose-700`}>
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
