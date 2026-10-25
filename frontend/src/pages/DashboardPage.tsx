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
import { HERO_PHOTO } from '../components/heroPhoto';
import { SiteFooter } from '../components/SiteFooter';
import { EmptyState, LoadError } from '../components/PageStates';
import { buttonAccent, buttonLight } from '../components/styles';
import { Toast, type ToastMessage } from '../components/Toast';
import { VehicleCard } from '../components/VehicleCard';
import { VehicleFiltersBar } from '../components/VehicleFiltersBar';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { CATEGORIES, CATEGORY_LABELS, type Category, type Vehicle, type VehicleFilters } from '../types';

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

/** Quick category filter, like the body-style tabs on dealership sites. */
function CategoryShortcuts({ selected, onSelect }: { selected: Category | ''; onSelect(category: Category | ''): void }) {
  const item = (active: boolean) =>
    `whitespace-nowrap border px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors ${
      active ? 'border-ink-900 bg-ink-900 text-white' : 'border-slate-300 text-slate-600 hover:border-ink-900 hover:text-ink-900'
    }`;
  return (
    <nav aria-label="Body styles" className="-mx-1 mt-8 flex gap-2 overflow-x-auto px-1 pb-1">
      <button type="button" aria-pressed={selected === ''} onClick={() => onSelect('')} className={item(selected === '')}>
        All
      </button>
      {CATEGORIES.map((c) => (
        <button key={c} type="button" aria-pressed={selected === c} onClick={() => onSelect(c)} className={item(selected === c)}>
          {CATEGORY_LABELS[c]}
        </button>
      ))}
    </nav>
  );
}

const REASONS = [
  ['Live stock', 'What you see is on the lot right now. Stock updates the moment a car is sold.'],
  ['Fair checkout', 'Your whole order goes through together or not at all, and two buyers can never get the same last car.'],
  ['Transparent prices', 'One clear price per car, with the details and photos to compare before you buy.'],
] as const;

/** Dark band with the dealership's promises, breaking up the page like a real showroom site. */
function WhyBuyHere() {
  return (
    <section aria-label="Why buy with us" className="bg-ink-900 text-white">
      <div className="page grid gap-10 py-16 sm:py-20 lg:grid-cols-[1fr_2fr]">
        <h2 className="display text-3xl leading-tight sm:text-4xl">Why buy with AutoVault</h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {REASONS.map(([title, text]) => (
            <div key={title} className="border-t border-white/25 pt-5">
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em]">{title}</p>
              <p className="mt-3 text-[15px] leading-relaxed text-white/75">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
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
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <section aria-label="Introduction" className="relative isolate overflow-hidden bg-ink-900 text-white">
        <img src={HERO_PHOTO.url} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        {/* Overlay keeps the white text well above AA contrast anywhere on the photo */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/60 to-black/25" aria-hidden="true" />
        <div className="page rise flex min-h-[min(78vh,720px)] flex-col justify-center py-20">
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-white/80">AutoVault Motors · New car showroom</p>
          <h1 className="display mt-5 max-w-3xl text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-7xl">
            Find the car that fits your life.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85">
            New cars from the brands you trust, with live stock and transparent prices. Browse the lot, compare the
            details, and buy online in minutes.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a href="#inventory" className={buttonLight}>
              Browse inventory
            </a>
          </div>
          <dl className="mt-14 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/20 pt-6">
            {[
              [load.status === 'ready' && !filtering ? String(vehicles.length) : '30+', 'Models on the lot'],
              ['8', 'Body styles'],
              ['All-or-nothing', 'Checkout'],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="text-[12px] uppercase tracking-[0.14em] text-white/70">{label}</dt>
                <dd className="display mt-1 text-2xl sm:text-3xl">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="page absolute inset-x-0 bottom-3 text-right text-[11px] text-white/60">
          Photo:{' '}
          <a href={HERO_PHOTO.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            {HERO_PHOTO.author}
          </a>{' '}
          · {HERO_PHOTO.license}
        </p>
      </section>

      <main id="inventory" className="page flex-1 scroll-mt-20 py-14 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow">Inventory</p>
            <h2 className="display mt-3 text-3xl text-ink-900 sm:text-4xl">Welcome, {user?.name.split(' ')[0]}</h2>
            <p className="mt-2 text-[17px] text-slate-500">Here's everything on the lot today.</p>
          </div>
          <div className="flex items-center gap-4">
            {load.status === 'ready' && (
              <p className="text-sm text-slate-500">
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

        <CategoryShortcuts
          selected={filters.category}
          onSelect={(category) => setFilters((f) => ({ ...f, category }))}
        />

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
            <div role="status" aria-label="Loading vehicles" className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="aspect-[4/5] animate-pulse bg-slate-100" />
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
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
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

      <WhyBuyHere />
      <SiteFooter />

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
