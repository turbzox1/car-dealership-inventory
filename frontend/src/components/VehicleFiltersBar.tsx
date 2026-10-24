import { CATEGORIES, CATEGORY_LABELS, type VehicleFilters } from '../types';

interface Props {
  filters: VehicleFilters;
  onChange(filters: VehicleFilters): void;
  onClear(): void;
  canClear: boolean;
  priceError?: string;
}

const inputClass =
  'mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-ink-700 focus:ring-4 focus:ring-ink-700/10';

/** Search and filter controls; every change is applied as the user types. */
export function VehicleFiltersBar({ filters, onChange, onClear, canClear, priceError }: Props) {
  const set = (key: keyof VehicleFilters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...filters, [key]: e.target.value });

  return (
    <section aria-label="Search and filters" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_1fr_0.8fr_0.8fr]">
        <label className="text-xs font-medium text-slate-600">
          Make
          <input className={inputClass} placeholder="e.g. Honda" value={filters.make} onChange={set('make')} />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Model
          <input className={inputClass} placeholder="e.g. Civic" value={filters.model} onChange={set('model')} />
        </label>
        <label className="text-xs font-medium text-slate-600">
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
        <label className="text-xs font-medium text-slate-600">
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
        <label className="text-xs font-medium text-slate-600">
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
          <p className="text-sm text-rose-600">{priceError}</p>
          {canClear && (
            <button
              type="button"
              onClick={onClear}
              className="text-sm font-medium text-ink-800 underline-offset-4 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </section>
  );
}
