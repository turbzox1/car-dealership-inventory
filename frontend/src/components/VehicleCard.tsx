import { formatPrice, stockLabel } from '../format';
import { CATEGORY_LABELS, type Category, type Vehicle } from '../types';
import { SketchCar } from './SketchCar';
import { buttonPrimary } from './styles';

/** Marker-wash colour behind each sketch: warm, low-saturation, decorative only. */
const CATEGORY_WASH: Record<Category, string> = {
  SEDAN: '#f3d18c',
  SUV: '#bfe3dc',
  TRUCK: '#ebc6a4',
  HATCHBACK: '#d8d3ea',
  COUPE: '#f1c3b5',
  CONVERTIBLE: '#f6dfa0',
  VAN: '#ddd6c6',
  EV: '#c3e3c8',
};

function stockDot(quantity: number): string {
  if (quantity === 0) return 'bg-slate-300';
  if (quantity <= 2) return 'bg-accent-500';
  return 'bg-teal-500';
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
  /** Only passed for admins; the controls aren't rendered otherwise. */
  admin?: AdminActions;
}

const adminButton =
  'rounded-full px-3 py-1.5 font-mono text-[12px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20';

export function VehicleCard({ vehicle, buying, onPurchase, admin }: VehicleCardProps) {
  const name = `${vehicle.make} ${vehicle.model}`;
  const soldOut = vehicle.quantity === 0;

  return (
    <article
      aria-label={name}
      className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-card transition-[border-color,box-shadow] duration-200 hover:border-slate-300 hover:shadow-[0_18px_40px_-28px_rgba(27,25,21,0.45)]"
    >
      <div className="relative bg-slate-100/70 px-6 pb-2 pt-9">
        <SketchCar
          withScene={false}
          wash={CATEGORY_WASH[vehicle.category]}
          className={`mx-auto h-28 w-auto transition-transform duration-300 motion-safe:group-hover:-translate-y-1 ${soldOut ? 'opacity-55 grayscale' : ''}`}
        />
        <span className="absolute left-4 top-4 rounded-full border border-slate-200 bg-card px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider text-slate-600">
          {CATEGORY_LABELS[vehicle.category]}
        </span>
      </div>

      <div className="flex flex-1 flex-col border-t border-slate-200 p-5">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">{vehicle.make}</p>
        <h3 className="display mt-1 text-2xl text-ink-900">{vehicle.model}</h3>

        <div className="mt-4 flex items-end justify-between gap-2">
          <p className="display text-[1.7rem] leading-none text-ink-900">{formatPrice(vehicle.price)}</p>
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-600">
            <span className={`h-2 w-2 rounded-full ${stockDot(vehicle.quantity)}`} aria-hidden="true" />
            {stockLabel(vehicle.quantity)}
          </span>
        </div>

        <button
          type="button"
          disabled={soldOut || buying}
          onClick={() => onPurchase(vehicle)}
          className={`${buttonPrimary} mt-5 w-full`}
        >
          {buying && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper" aria-hidden="true" />
          )}
          {buying ? 'Buying…' : 'Purchase'}
        </button>

        {admin && (
          <div className="mt-3 flex items-center justify-between gap-1 border-t border-dashed border-slate-200 pt-3">
            <button
              type="button"
              aria-label={`Restock ${name}`}
              onClick={() => admin.onRestock(vehicle)}
              className={`${adminButton} bg-teal-500/10 text-teal-700 hover:bg-teal-500/20`}
            >
              + restock
            </button>
            <div className="flex gap-1">
              <button
                type="button"
                aria-label={`Edit ${name}`}
                onClick={() => admin.onEdit(vehicle)}
                className={`${adminButton} text-slate-600 hover:bg-slate-100 hover:text-ink-900`}
              >
                edit
              </button>
              <button
                type="button"
                aria-label={`Delete ${name}`}
                onClick={() => admin.onDelete(vehicle)}
                className={`${adminButton} text-rose-700 hover:bg-rose-50`}
              >
                delete
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
