import { orderNumber } from '../api/orders';
import { formatDateTime, formatPrice } from '../format';
import type { Order } from '../types';

/**
 * One order: header (number, date, size, total, customer for admins) and its lines.
 * The table uses fixed column widths so every order card lines up with the next.
 */
export function OrderCard({ order }: { order: Order }) {
  const number = orderNumber(order.id);
  const th = 'px-6 py-4 text-left text-[13px] font-semibold uppercase tracking-[0.12em] text-slate-500';
  const td = 'px-6 py-5 text-[17px] text-slate-600';
  const units = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <article aria-label={`Order #${number}`} className="border border-slate-200 bg-card">
      <header className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-b border-slate-200 px-6 py-5">
        <div>
          <h2 className="text-base font-semibold uppercase tracking-[0.1em] text-ink-900">Order #{number}</h2>
          <p className="mt-1.5 text-[16px] text-slate-500">
            {formatDateTime(order.createdAt)} · {order.items.length} {order.items.length === 1 ? 'vehicle' : 'vehicles'}
            {units !== order.items.length && ` (${units} units)`}
          </p>
        </div>
        <div className="flex items-center gap-8">
          {order.customer && (
            <div className="text-right">
              <p className="text-base font-semibold text-ink-900">{order.customer.name}</p>
              <p className="text-sm text-slate-500">{order.customer.email}</p>
            </div>
          )}
          <p className="display text-3xl text-ink-900">{formatPrice(order.total)}</p>
        </div>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] table-fixed">
          <colgroup>
            <col />
            <col className="w-28" />
            <col className="w-48" />
            <col className="w-48" />
          </colgroup>
          <thead className="border-b border-slate-200">
            <tr>
              <th scope="col" className={th}>Vehicle</th>
              <th scope="col" className={`${th} text-right`}>Qty</th>
              <th scope="col" className={`${th} text-right`}>Unit price</th>
              <th scope="col" className={`${th} text-right`}>Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {order.items.map((item) => (
              <tr key={item.vehicleId}>
                <td className={`${td} truncate font-medium text-ink-900`}>{`${item.make} ${item.model}`}</td>
                <td className={`${td} text-right tabular-nums`}>{item.quantity}</td>
                <td className={`${td} text-right tabular-nums`}>{formatPrice(item.unitPrice)}</td>
                <td className={`${td} text-right font-semibold tabular-nums text-ink-900`}>{formatPrice(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
