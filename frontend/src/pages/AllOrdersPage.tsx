import { useState } from 'react';
import { controlClass } from '../components/styles';
import { fetchAllPurchases } from '../api/purchases';
import { AppHeader } from '../components/AppHeader';
import { OrdersTable } from '../components/OrdersTable';
import { EmptyState, LoadError, LoadingRows } from '../components/PageStates';
import { formatPrice } from '../format';
import { useApiResource } from '../hooks/useApiResource';
import type { Purchase } from '../types';

function matches(order: Purchase, query: string): boolean {
  const haystack = `${order.customer?.name} ${order.customer?.email} ${order.make} ${order.model}`.toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-card px-6 py-5">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="display mt-2 text-3xl text-ink-900">{value}</p>
    </div>
  );
}

/** Admin view of every sale. Search runs in the browser over the loaded list. */
export function AllOrdersPage() {
  const [orders, reload] = useApiResource(fetchAllPurchases);
  const [query, setQuery] = useState('');

  const all = orders.status === 'ready' ? orders.data : [];
  const visible = query.trim() ? all.filter((o) => matches(o, query)) : all;
  const revenue = all.reduce((sum, o) => sum + o.totalPrice, 0);
  const units = all.reduce((sum, o) => sum + o.quantity, 0);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <span className="eyebrow">Admin</span>
        <h1 className="display mt-4 text-4xl text-ink-900 sm:text-5xl">All orders</h1>
        <p className="mt-2 text-[17px] text-slate-500">Every sale across the showroom.</p>

        {orders.status === 'ready' && (
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Stat label="Revenue" value={formatPrice(revenue)} />
            <Stat label="Orders" value={String(all.length)} />
            <Stat label="Units" value={`${units} ${units === 1 ? 'unit' : 'units'} sold`} />
          </div>
        )}

        <section className="mt-6" aria-label="Orders">
          {orders.status === 'loading' && <LoadingRows label="Loading orders" />}
          {orders.status === 'error' && <LoadError what="orders" error={orders.error} onRetry={reload} />}
          {orders.status === 'ready' && all.length === 0 && <EmptyState title="No sales yet" />}
          {orders.status === 'ready' && all.length > 0 && (
            <>
              <input
                type="search"
                aria-label="Search orders"
                placeholder="Search by customer or vehicle"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={`mb-4 max-w-sm ${controlClass(false, 'sm')}`}
              />
              {visible.length > 0 ? (
                <OrdersTable orders={visible} showCustomer />
              ) : (
                <EmptyState title="No orders match your search" />
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
