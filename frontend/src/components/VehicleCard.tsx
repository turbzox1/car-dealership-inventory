import { formatPrice, stockLabel } from '../format';
import { CATEGORY_LABELS, type Category, type Vehicle } from '../types';

/** A soft colour per category, so the grid is easy to scan. */
const CATEGORY_TINT: Record<Category, string> = {
  SEDAN: 'from-sky-100 to-sky-50 text-sky-700',
  SUV: 'from-emerald-100 to-emerald-50 text-emerald-700',
  TRUCK: 'from-amber-100 to-amber-50 text-amber-700',
  HATCHBACK: 'from-violet-100 to-violet-50 text-violet-700',
  COUPE: 'from-rose-100 to-rose-50 text-rose-700',
  CONVERTIBLE: 'from-orange-100 to-orange-50 text-orange-700',
  VAN: 'from-slate-200 to-slate-50 text-slate-700',
  EV: 'from-teal-100 to-teal-50 text-teal-700',
};

function stockTone(quantity: number): string {
  if (quantity === 0) return 'bg-slate-100 text-slate-500';
  if (quantity <= 2) return 'bg-amber-100 text-amber-800';
  return 'bg-emerald-100 text-emerald-800';
}

interface VehicleCardProps {
  vehicle: Vehicle;
  buying: boolean;
  onPurchase(vehicle: Vehicle): void;
}

export function VehicleCard({ vehicle, buying, onPurchase }: VehicleCardProps) {
  const soldOut = vehicle.quantity === 0;
  const tint = CATEGORY_TINT[vehicle.category];

  return (
    <article
      aria-label={`${vehicle.make} ${vehicle.model}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={`relative flex h-32 items-center justify-center bg-gradient-to-br ${tint}`}>
        <svg viewBox="0 0 64 32" className="h-14 w-28 opacity-80 transition group-hover:scale-105" aria-hidden="true">
          <path
            fill="currentColor"
            d="M6 22l4-9a5 5 0 0 1 4.6-3h20.8a6 6 0 0 1 4.2 1.7L46 18h8a4 4 0 0 1 4 4v3a1 1 0 0 1-1 1h-4a5 5 0 0 0-10 0H23a5 5 0 0 0-10 0H7a1 1 0 0 1-1-1z"
          />
          <circle cx="18" cy="26" r="3.5" fill="currentColor" />
          <circle cx="48" cy="26" r="3.5" fill="currentColor" />
        </svg>
        <span className="absolute left-3 top-3 rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-semibold">
          {CATEGORY_LABELS[vehicle.category]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{vehicle.make}</p>
        <h3 className="mt-0.5 font-display text-xl font-semibold text-ink-900">{vehicle.model}</h3>

        <div className="mt-4 flex items-end justify-between gap-2">
          <p className="font-display text-2xl font-semibold text-ink-900">{formatPrice(vehicle.price)}</p>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${stockTone(vehicle.quantity)}`}>
            {stockLabel(vehicle.quantity)}
          </span>
        </div>

        <button
          type="button"
          disabled={soldOut || buying}
          onClick={() => onPurchase(vehicle)}
          className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-400/50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          {buying && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
          )}
          {buying ? 'Buying…' : 'Purchase'}
        </button>
      </div>
    </article>
  );
}
