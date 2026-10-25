import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { fetchVehicle, purchaseVehicle } from '../api/vehicles';
import { useApi } from '../api/useApi';
import { useCart } from '../cart/useCart';
import { AppHeader } from '../components/AppHeader';
import { LoadError, LoadingRows } from '../components/PageStates';
import { SiteFooter } from '../components/SiteFooter';
import { buttonOutline, buttonPrimary } from '../components/styles';
import { Toast, type ToastMessage } from '../components/Toast';
import { PhotoCredit, VehicleCover } from '../components/VehiclePhoto';
import { formatPrice, stockLabel } from '../format';
import { useApiResource } from '../hooks/useApiResource';
import { CATEGORY_LABELS, type Vehicle } from '../types';

const backLink = 'text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500 hover:text-ink-900';

function Gallery({ vehicle }: { vehicle: Vehicle }) {
  const images = vehicle.images ?? [];
  const [index, setIndex] = useState(0);
  const current = images[index];

  if (!current) return <VehicleCover vehicle={vehicle} size="full" className="aspect-[16/10] w-full" />;

  return (
    <div>
      <div className="overflow-hidden bg-slate-100">
        <img src={current.url} alt={current.title} className="aspect-[16/10] w-full object-cover" />
      </div>
      <PhotoCredit image={current} className="mt-2" />
      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {images.map((image, i) => (
            <button
              key={image.sourceUrl}
              type="button"
              aria-label={`Show photo ${i + 1}`}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
              className={`overflow-hidden bg-slate-100 outline-none ring-offset-2 transition focus-visible:ring-2 focus-visible:ring-ink-900 ${
                i === index ? 'ring-2 ring-ink-900' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <img src={image.thumbUrl} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Details({ vehicle }: { vehicle: Vehicle }) {
  const rows: [string, string | null][] = [
    ['Year', vehicle.year ? String(vehicle.year) : null],
    ['Body', CATEGORY_LABELS[vehicle.category]],
    ['Fuel', vehicle.fuelType ?? null],
    ['Transmission', vehicle.transmission ?? null],
    ['Seats', vehicle.seats ? `${vehicle.seats} seats` : null],
  ];
  return (
    <ul aria-label="Details" className="grid grid-cols-2 border-t border-slate-200">
      {rows
        .filter((row): row is [string, string] => row[1] !== null)
        .map(([label, value]) => (
          <li key={label} className="border-b border-slate-200 py-3 pr-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <p className="mt-0.5 font-medium text-ink-900">{value}</p>
          </li>
        ))}
    </ul>
  );
}

export function VehicleDetailPage() {
  const { id = '' } = useParams();
  const call = useApi();
  const cart = useCart();
  const fetcher = useCallback((c: Parameters<typeof fetchVehicle>[0]) => fetchVehicle(c, id), [id]);
  const [resource, reload] = useApiResource(fetcher);
  const [bought, setBought] = useState<Vehicle | null>(null);
  const [buying, setBuying] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const loaded = resource.status === 'ready' ? resource.data : null;
  // After a purchase, show the stock the server returned
  const vehicle = bought ?? loaded;

  async function handlePurchase(v: Vehicle) {
    setBuying(true);
    try {
      const { vehicle: updated } = await purchaseVehicle(call, v.id);
      setBought({ ...v, ...updated });
      setToast({ id: Date.now(), tone: 'success', text: `You bought a ${v.make} ${v.model}.` });
    } catch (err) {
      setToast({ id: Date.now(), tone: 'error', text: err instanceof ApiError ? err.message : 'Purchase failed.' });
    } finally {
      setBuying(false);
    }
  }

  function handleAddToCart(v: Vehicle) {
    if (cart.add(v)) setToast({ id: Date.now(), tone: 'success', text: `Added ${v.make} ${v.model} to your cart.` });
  }

  const notFound = resource.status === 'error' && resource.error?.status === 404;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="page flex-1 py-8 sm:py-12">
        <Link to="/" className={backLink}>
          ← Back to inventory
        </Link>

        {resource.status === 'loading' && (
          <div className="mt-8">
            <LoadingRows label="Loading vehicle" />
          </div>
        )}
        {notFound && (
          <div className="mt-10 border border-slate-200 px-6 py-16 text-center">
            <p className="display text-3xl">Vehicle not found</p>
            <p className="mt-2 text-slate-500">It may have been sold out and removed from the showroom.</p>
          </div>
        )}
        {resource.status === 'error' && !notFound && (
          <div className="mt-8">
            <LoadError what="this vehicle" error={resource.error} onRetry={reload} />
          </div>
        )}

        {vehicle && (
          <div className="rise mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)] lg:gap-14">
            <Gallery vehicle={vehicle} />

            <section aria-label="Overview">
              <p className="eyebrow">{vehicle.make}</p>
              <h1 className="display mt-2 text-4xl leading-tight sm:text-5xl">
                {vehicle.make} {vehicle.model}
              </h1>
              <p className="display mt-4 text-3xl">{formatPrice(vehicle.price)}</p>
              <p className="mt-2 text-sm text-slate-600">{stockLabel(vehicle.quantity)}</p>

              <div className="mt-6 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleAddToCart(vehicle)}
                  disabled={vehicle.quantity === 0 || cart.quantityOf(vehicle.id) >= vehicle.quantity}
                  className={buttonPrimary}
                >
                  {vehicle.quantity > 0 && cart.quantityOf(vehicle.id) >= vehicle.quantity ? 'All in cart' : 'Add to cart'}
                </button>
                <button
                  type="button"
                  onClick={() => handlePurchase(vehicle)}
                  disabled={vehicle.quantity === 0 || buying}
                  className={buttonOutline}
                >
                  {buying ? 'Buying…' : 'Purchase'}
                </button>
              </div>

              <div className="mt-8">
                <Details vehicle={vehicle} />
              </div>

              {vehicle.description && (
                <div className="mt-8">
                  <h2 className="eyebrow">About this car</h2>
                  <p className="mt-3 text-[17px] leading-relaxed text-slate-600">{vehicle.description}</p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
      <SiteFooter />
      <Toast message={toast} onDismiss={dismissToast} />
    </div>
  );
}
