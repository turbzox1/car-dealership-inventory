import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';
import { useApi } from '../api/useApi';
import { fetchVehicles, hasActiveFilters, purchaseVehicle } from '../api/vehicles';
import { useAuth } from '../auth/useAuth';
import { AppHeader } from '../components/AppHeader';
import { Toast, type ToastMessage } from '../components/Toast';
import { VehicleCard } from '../components/VehicleCard';
import { VehicleFiltersBar } from '../components/VehicleFiltersBar';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import type { Vehicle, VehicleFilters } from '../types';

const NO_FILTERS: VehicleFilters = { make: '', model: '', category: '', minPrice: '', maxPrice: '' };
const SEARCH_DELAY_MS = 300;

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; vehicles: Vehicle[] };

function priceRangeError({ minPrice, maxPrice }: VehicleFilters): string | undefined {
  if (minPrice !== '' && maxPrice !== '' && Number(minPrice) > Number(maxPrice)) {
    return "Min price can't be above max price";
  }
  return undefined;
}

export function DashboardPage() {
  const call = useApi();
  const { user } = useAuth();
  const [filters, setFilters] = useState<VehicleFilters>(NO_FILTERS);
  const appliedFilters = useDebouncedValue(filters, SEARCH_DELAY_MS);
  const [reloadKey, setReloadKey] = useState(0);
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const buyingRef = useRef(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const priceError = priceRangeError(filters);
  const reload = useCallback(() => {
    // From the error screen show the skeleton again; a loaded list stays visible while it refreshes
    setLoad((current) => (current.status === 'ready' ? current : { status: 'loading' }));
    setReloadKey((k) => k + 1);
  }, []);
  const notify = useCallback((tone: ToastMessage['tone'], text: string) => setToast({ id: Date.now(), tone, text }), []);
  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    // An impossible price range is shown inline; keep the last good results instead of asking the API
    if (priceRangeError(appliedFilters)) return;

    let stale = false;
    fetchVehicles(call, appliedFilters).then(
      (vehicles) => !stale && setLoad({ status: 'ready', vehicles }),
      () => !stale && setLoad({ status: 'error' }), // a 401 has already signed the user out
    );
    return () => {
      stale = true; // ignore responses to searches the user has already typed past
    };
  }, [call, appliedFilters, reloadKey]);

  async function handlePurchase(vehicle: Vehicle) {
    if (buyingRef.current) return;
    buyingRef.current = true;
    setBuyingId(vehicle.id);
    try {
      const { vehicle: updated } = await purchaseVehicle(call, vehicle.id);
      setLoad((current) =>
        current.status === 'ready'
          ? { status: 'ready', vehicles: current.vehicles.map((v) => (v.id === updated.id ? updated : v)) }
          : current,
      );
      notify('success', `You bought a ${vehicle.make} ${vehicle.model}.`);
    } catch (err) {
      notify('error', err instanceof ApiError ? err.message : 'Purchase failed. Please try again.');
      // Stock changed under us (sold out, removed): show the current numbers
      if (err instanceof ApiError && (err.status === 409 || err.status === 404)) reload();
    } finally {
      buyingRef.current = false;
      setBuyingId(null);
    }
  }

  const filtering = hasActiveFilters(filters);
  const vehicles = load.status === 'ready' ? load.vehicles : [];
  const inStock = vehicles.filter((v) => v.quantity > 0).length;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900">
              Welcome, {user?.name.split(' ')[0]}
            </h1>
            <p className="mt-1 text-slate-600">Browse the showroom and buy in one click.</p>
          </div>
          {load.status === 'ready' && (
            <p className="text-sm text-slate-500">
              {vehicles.length} {vehicles.length === 1 ? 'vehicle' : 'vehicles'} · {inStock} in stock
            </p>
          )}
        </div>

        <div className="mt-6">
          <VehicleFiltersBar
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters(NO_FILTERS)}
            canClear={filtering}
            priceError={priceError}
          />
        </div>

        <section aria-label="Vehicles" className="mt-6">
          {load.status === 'loading' && (
            <div role="status" aria-label="Loading vehicles" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-200/70" />
              ))}
            </div>
          )}

          {load.status === 'error' && (
            <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
              <p className="font-medium text-rose-800">We couldn't load vehicles.</p>
              <p className="mt-1 text-sm text-rose-700">Check your connection and try again.</p>
              <button
                type="button"
                onClick={reload}
                className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
              >
                Try again
              </button>
            </div>
          )}

          {load.status === 'ready' && vehicles.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="font-display text-lg font-semibold text-ink-900">
                {filtering ? 'No vehicles match your filters' : 'No vehicles yet'}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {filtering ? 'Try a broader search or clear the filters.' : 'New stock will show up here.'}
              </p>
            </div>
          )}

          {load.status === 'ready' && vehicles.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  buying={buyingId === vehicle.id}
                  onPurchase={handlePurchase}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <Toast message={toast} onDismiss={dismissToast} />
    </div>
  );
}
