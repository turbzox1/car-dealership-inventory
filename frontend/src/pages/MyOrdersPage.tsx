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
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900">My orders</h1>
            <p className="mt-1 text-slate-600">Every vehicle you've bought, newest first.</p>
          </div>
          {orders.status === 'ready' && orders.data.length > 0 && (
            <p className="text-sm text-slate-500">
              {orders.data.length} {orders.data.length === 1 ? 'order' : 'orders'} · {formatPrice(spent)} spent
            </p>
          )}
        </div>

        <section className="mt-6" aria-label="Orders">
          {orders.status === 'loading' && <LoadingRows label="Loading orders" />}
          {orders.status === 'error' && <LoadError what="your orders" error={orders.error} onRetry={reload} />}
          {orders.status === 'ready' && orders.data.length === 0 && (
            <EmptyState title="You haven't bought anything yet">
              <Link to="/" className="font-medium text-ink-800 underline-offset-4 hover:underline">
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
