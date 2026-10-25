import { orderNumber } from '../api/orders';
import { formatDateTime, formatPrice } from '../format';
import type { Order } from '../types';

/** One order: header (number, date, size, total, customer for admins) and its lines. */
export function OrderCard({ order }: { order: Order }) {
  const number = orderNumber(order.id);
  const th = 'px-5 py-2.5 text-left font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500';
  const td = 'px-5 py-3 text-[15px] text-slate-600';

  return (
    <article aria-label={`Order #${number}`} className="overflow-hidden rounded-3xl border border-slate-200 bg-card">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-slate-200 px-5 py-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="font-mono text-sm font-medium text-ink-900">Order #{number}</h2>
          <span className="text-sm text-slate-500">{formatDateTime(order.createdAt)}</span>
          <span className="font-mono text-xs text-slate-500">
            {order.items.length} {order.items.length === 1 ? 'vehicle' : 'vehicles'}
          </span>
        </div>
        <div className="flex items-center gap-6">
          {order.customer && (
            <div className="text-right">
              <p className="text-sm font-semibold text-ink-900">{order.customer.name}</p>
              <p className="font-mono text-[11px] text-slate-500">{order.customer.email}</p>
            </div>
          )}
          <p className="display text-2xl text-ink-900">{formatPrice(order.total)}</p>
        </div>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th scope="col" className={th}>Vehicle</th>
              <th scope="col" className={`${th} text-right`}>Qty</th>
              <th scope="col" className={`${th} text-right`}>Unit price</th>
              <th scope="col" className={`${th} text-right`}>Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70">
            {order.items.map((item) => (
              <tr key={item.vehicleId}>
                <td className={`${td} whitespace-nowrap font-medium text-ink-900`}>{`${item.make} ${item.model}`}</td>
                <td className={`${td} text-right tabular-nums`}>{item.quantity}</td>
                <td className={`${td} whitespace-nowrap text-right tabular-nums`}>{formatPrice(item.unitPrice)}</td>
                <td className={`${td} whitespace-nowrap text-right font-semibold tabular-nums text-ink-900`}>
                  {formatPrice(item.totalPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
