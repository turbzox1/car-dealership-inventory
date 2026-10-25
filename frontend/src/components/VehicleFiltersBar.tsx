import { CATEGORIES, CATEGORY_LABELS, type VehicleFilters } from '../types';
import { controlClass } from './styles';

interface Props {
  filters: VehicleFilters;
  onChange(filters: VehicleFilters): void;
  onClear(): void;
  canClear: boolean;
  priceError?: string;
}

// Smaller than form fields so five filters fit on one row
// Inputs sit inside the mono uppercase labels, so reset the inherited type styles
const inputClass = `mt-1.5 ${controlClass(false, 'sm')} font-sans normal-case tracking-normal`;

/** Search and filter controls; every change is applied as the user types. */
export function VehicleFiltersBar({ filters, onChange, onClear, canClear, priceError }: Props) {
  const set = (key: keyof VehicleFilters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...filters, [key]: e.target.value });

  return (
    <section aria-label="Search and filters" className="border border-slate-200 bg-card p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_1fr_0.8fr_0.8fr]">
        <label className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
          Make
          <input className={inputClass} placeholder="e.g. Honda" value={filters.make} onChange={set('make')} />
        </label>
        <label className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
          Model
          <input className={inputClass} placeholder="e.g. Civic" value={filters.model} onChange={set('model')} />
        </label>
        <label className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
          Category
          <select className={inputClass} value={filters.category} onChange={set('category')}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
          Min price
          <input
            className={inputClass}
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="$0"
            value={filters.minPrice}
            onChange={set('minPrice')}
            aria-invalid={priceError ? true : undefined}
          />
        </label>
        <label className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
          Max price
          <input
            className={inputClass}
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Any"
            value={filters.maxPrice}
            onChange={set('maxPrice')}
            aria-invalid={priceError ? true : undefined}
          />
        </label>
      </div>
      {(priceError || canClear) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-rose-700">{priceError}</p>
          {canClear && (
            <button
              type="button"
              onClick={onClear}
              className="text-sm font-semibold text-ink-900 underline decoration-accent-400 decoration-2 underline-offset-4 transition-colors hover:decoration-accent-600"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </section>
  );
}
