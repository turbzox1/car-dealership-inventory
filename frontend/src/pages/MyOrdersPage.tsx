import { Link } from 'react-router-dom';
import { fetchMyOrders } from '../api/orders';
import { AppHeader } from '../components/AppHeader';
import { SiteFooter } from '../components/SiteFooter';
import { OrderCard } from '../components/OrderCard';
import { EmptyState, LoadError, LoadingRows } from '../components/PageStates';
import { formatPrice } from '../format';
import { useApiResource } from '../hooks/useApiResource';

export function MyOrdersPage() {
  const [orders, reload] = useApiResource(fetchMyOrders);
  const spent = orders.status === 'ready' ? orders.data.reduce((sum, o) => sum + o.total, 0) : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="page flex-1 py-10 sm:py-14">
        <span className="eyebrow">Purchase history</span>
        <h1 className="display mt-4 text-4xl text-ink-900 sm:text-5xl">My orders</h1>
        <p className="mt-2 text-[17px] text-slate-500">Every order you've placed, newest first.</p>
        {orders.status === 'ready' && orders.data.length > 0 && (
          <p className="mt-2 text-lg font-medium text-ink-900">
            {orders.data.length} {orders.data.length === 1 ? 'order' : 'orders'} · {formatPrice(spent)} spent
          </p>
        )}

        <section className="mt-8" aria-label="Orders">
          {orders.status === 'loading' && <LoadingRows label="Loading orders" />}
          {orders.status === 'error' && <LoadError what="your orders" error={orders.error} onRetry={reload} />}
          {orders.status === 'ready' && orders.data.length === 0 && (
            <EmptyState title="You haven't bought anything yet">
              <Link to="/" className="font-semibold text-ink-900 underline decoration-accent-400 decoration-2 underline-offset-4 transition-colors hover:decoration-accent-600">
                Browse the showroom
              </Link>
            </EmptyState>
          )}
          {orders.status === 'ready' && orders.data.length > 0 && (
            <div className="space-y-6">
              {orders.data.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
