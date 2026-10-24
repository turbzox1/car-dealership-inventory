import { Link } from 'react-router-dom';
import { fetchMyPurchases } from '../api/purchases';
import { AppHeader } from '../components/AppHeader';
import { OrdersTable } from '../components/OrdersTable';
import { EmptyState, LoadError, LoadingRows } from '../components/PageStates';
import { formatPrice } from '../format';
import { useApiResource } from '../hooks/useApiResource';

export function MyOrdersPage() {
  const [orders, reload] = useApiResource(fetchMyPurchases);
  const spent = orders.status === 'ready' ? orders.data.reduce((sum, o) => sum + o.totalPrice, 0) : 0;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="eyebrow">Purchase history</span>
            <h1 className="display mt-4 text-4xl text-ink-900 sm:text-5xl">My orders</h1>
            <p className="mt-2 text-[17px] text-slate-500">Every vehicle you've bought, newest first.</p>
          </div>
          {orders.status === 'ready' && orders.data.length > 0 && (
            <p className="font-mono text-xs text-slate-500">
              {orders.data.length} {orders.data.length === 1 ? 'order' : 'orders'} · {formatPrice(spent)} spent
            </p>
          )}
        </div>

        <section className="mt-6" aria-label="Orders">
          {orders.status === 'loading' && <LoadingRows label="Loading orders" />}
          {orders.status === 'error' && <LoadError what="your orders" error={orders.error} onRetry={reload} />}
          {orders.status === 'ready' && orders.data.length === 0 && (
            <EmptyState title="You haven't bought anything yet">
              <Link to="/" className="font-semibold text-ink-900 underline decoration-accent-400 decoration-2 underline-offset-4 transition-colors hover:decoration-accent-600">
                Browse the showroom
              </Link>
            </EmptyState>
          )}
          {orders.status === 'ready' && orders.data.length > 0 && <OrdersTable orders={orders.data} />}
        </section>
      </main>
    </div>
  );
}
