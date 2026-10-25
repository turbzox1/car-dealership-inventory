import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createVehicle,
  deleteVehicle,
  restockVehicle,
  updateVehicle,
  type NewVehicle,
  type VehicleDetails,
} from '../api/adminVehicles';
import { ApiError } from '../api/client';
import { DeleteVehicleDialog } from '../components/admin/DeleteVehicleDialog';
import { RestockDialog } from '../components/admin/RestockDialog';
import { VehicleFormDialog } from '../components/admin/VehicleFormDialog';
import { useApi } from '../api/useApi';
import { fetchVehicles, hasActiveFilters, purchaseVehicle } from '../api/vehicles';
import { useAuth } from '../auth/useAuth';
import { useCart } from '../cart/useCart';
import { AppHeader } from '../components/AppHeader';
import { EmptyState, LoadError } from '../components/PageStates';
import { buttonAccent } from '../components/styles';
import { Toast, type ToastMessage } from '../components/Toast';
import { VehicleCard } from '../components/VehicleCard';
import { VehicleFiltersBar } from '../components/VehicleFiltersBar';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import type { Vehicle, VehicleFilters } from '../types';

const NO_FILTERS: VehicleFilters = { make: '', model: '', category: '', minPrice: '', maxPrice: '' };
const SEARCH_DELAY_MS = 300;

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; vehicles: Vehicle[] };

/** Which admin dialog is open, if any. */
type AdminDialog =
  | { kind: 'add' }
  | { kind: 'edit'; vehicle: Vehicle }
  | { kind: 'restock'; vehicle: Vehicle }
  | { kind: 'delete'; vehicle: Vehicle }
  | null;

function priceRangeError({ minPrice, maxPrice }: VehicleFilters): string | undefined {
  if (minPrice !== '' && maxPrice !== '' && Number(minPrice) > Number(maxPrice)) {
    return "Min price can't be above max price";
  }
  return undefined;
}

export function DashboardPage() {
  const call = useApi();
  const cart = useCart();
  const { user } = useAuth();
  const [filters, setFilters] = useState<VehicleFilters>(NO_FILTERS);
  const appliedFilters = useDebouncedValue(filters, SEARCH_DELAY_MS);
  const [reloadKey, setReloadKey] = useState(0);
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const buyingRef = useRef(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [adminDialog, setAdminDialog] = useState<AdminDialog>(null);
  const isAdmin = user?.role === 'ADMIN';

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

  /** Applies a change to the loaded list without refetching. */
  const updateList = useCallback((change: (vehicles: Vehicle[]) => Vehicle[]) => {
    setLoad((current) => (current.status === 'ready' ? { status: 'ready', vehicles: change(current.vehicles) } : current));
  }, []);
  const replaceVehicle = (updated: Vehicle) => updateList((list) => list.map((v) => (v.id === updated.id ? updated : v)));
  const closeAdminDialog = useCallback(() => setAdminDialog(null), []);

  // Each handler throws on failure so the dialog stays open and shows the error
  async function handleAdd(values: NewVehicle | VehicleDetails) {
    const created = await createVehicle(call, values as NewVehicle);
    updateList((list) => [created, ...list]);
    setAdminDialog(null);
    notify('success', `Added ${created.make} ${created.model}.`);
  }

  async function handleEdit(id: string, values: VehicleDetails) {
    replaceVehicle(await updateVehicle(call, id, values));
    setAdminDialog(null);
    notify('success', 'Changes saved.');
  }

  async function handleRestock(vehicle: Vehicle, amount: number) {
    replaceVehicle(await restockVehicle(call, vehicle.id, amount));
    setAdminDialog(null);
    notify('success', `Added ${amount} × ${vehicle.make} ${vehicle.model} to stock.`);
  }

  async function handleDelete(vehicle: Vehicle) {
    await deleteVehicle(call, vehicle.id);
    updateList((list) => list.filter((v) => v.id !== vehicle.id));
    setAdminDialog(null);
    notify('success', `Deleted ${vehicle.make} ${vehicle.model}.`);
  }

  const adminActions = isAdmin
    ? {
        onEdit: (vehicle: Vehicle) => setAdminDialog({ kind: 'edit', vehicle }),
        onRestock: (vehicle: Vehicle) => setAdminDialog({ kind: 'restock', vehicle }),
        onDelete: (vehicle: Vehicle) => setAdminDialog({ kind: 'delete', vehicle }),
      }
    : undefined;

  function handleAddToCart(vehicle: Vehicle) {
    if (cart.add(vehicle)) notify('success', `Added ${vehicle.make} ${vehicle.model} to your cart.`);
  }

  async function handlePurchase(vehicle: Vehicle) {
    if (buyingRef.current) return;
    buyingRef.current = true;
    setBuyingId(vehicle.id);
    try {
      const { vehicle: updated } = await purchaseVehicle(call, vehicle.id);
      replaceVehicle(updated);
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
      <main className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12 sm:py-14">
        <div className="rise flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="eyebrow">Showroom</span>
            <h1 className="display mt-4 text-4xl text-ink-900 sm:text-5xl">
              Welcome,{' '}
              <span className="font-script text-[1.1em] font-bold tracking-normal text-accent-600">
                {user?.name.split(' ')[0]}
              </span>
            </h1>
            <p className="mt-2 text-[17px] text-slate-500">Browse the lot and buy in one click.</p>
          </div>
          <div className="flex items-center gap-4">
            {load.status === 'ready' && (
              <p className="font-mono text-xs text-slate-500">
                {vehicles.length} {vehicles.length === 1 ? 'vehicle' : 'vehicles'} · {inStock} in stock
              </p>
            )}
            {isAdmin && (
              <button type="button" onClick={() => setAdminDialog({ kind: 'add' })} className={buttonAccent}>
                + Add vehicle
              </button>
            )}
          </div>
        </div>

        <div className="mt-8">
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
            <div role="status" aria-label="Loading vehicles" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-[22rem] animate-pulse rounded-3xl bg-slate-200/60" />
              ))}
            </div>
          )}

          {load.status === 'error' && <LoadError what="vehicles" error={null} onRetry={reload} />}

          {load.status === 'ready' && vehicles.length === 0 && (
            <EmptyState title={filtering ? 'No vehicles match your filters' : 'No vehicles yet'}>
              {filtering ? 'Try a broader search or clear the filters.' : 'New stock will show up here.'}
            </EmptyState>
          )}

          {load.status === 'ready' && vehicles.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  buying={buyingId === vehicle.id}
                  onPurchase={handlePurchase}
                  inCart={cart.quantityOf(vehicle.id)}
                  onAddToCart={handleAddToCart}
                  admin={adminActions}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {adminDialog?.kind === 'add' && <VehicleFormDialog onClose={closeAdminDialog} onSubmit={handleAdd} />}
      {adminDialog?.kind === 'edit' && (
        <VehicleFormDialog
          vehicle={adminDialog.vehicle}
          onClose={closeAdminDialog}
          onSubmit={(values) => handleEdit(adminDialog.vehicle.id, values)}
        />
      )}
      {adminDialog?.kind === 'restock' && (
        <RestockDialog
          vehicle={adminDialog.vehicle}
          onClose={closeAdminDialog}
          onSubmit={(amount) => handleRestock(adminDialog.vehicle, amount)}
        />
      )}
      {adminDialog?.kind === 'delete' && (
        <DeleteVehicleDialog
          vehicle={adminDialog.vehicle}
          onClose={closeAdminDialog}
          onConfirm={() => handleDelete(adminDialog.vehicle)}
        />
      )}
      <Toast message={toast} onDismiss={dismissToast} />
    </div>
  );
}
