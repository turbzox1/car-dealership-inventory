import { useState } from 'react';
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
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-ink-900">{value}</p>
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
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900">All orders</h1>
        <p className="mt-1 text-slate-600">Every sale across the showroom.</p>

        {orders.status === 'ready' && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
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
                className="mb-4 block w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-ink-700 focus:ring-4 focus:ring-ink-700/10"
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
