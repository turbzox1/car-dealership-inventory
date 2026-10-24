import { formatDateTime, formatPrice } from '../format';
import type { Purchase } from '../types';

/** Purchase history table; `showCustomer` adds the buyer column for the admin view. */
export function OrdersTable({ orders, showCustomer = false }: { orders: Purchase[]; showCustomer?: boolean }) {
  const th = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500';
  const td = 'px-4 py-3.5 text-sm text-slate-700';

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className={th}>Date</th>
            {showCustomer && <th scope="col" className={th}>Customer</th>}
            <th scope="col" className={th}>Vehicle</th>
            <th scope="col" className={`${th} text-right`}>Qty</th>
            <th scope="col" className={`${th} text-right`}>Unit price</th>
            <th scope="col" className={`${th} text-right`}>Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((order) => (
            <tr key={order.id} className="transition hover:bg-slate-50/70">
              <td className={`${td} whitespace-nowrap text-slate-500`}>{formatDateTime(order.purchasedAt)}</td>
              {showCustomer && (
                <td className={td}>
                  <div className="font-medium text-slate-900">{order.customer?.name}</div>
                  <div className="text-xs text-slate-500">{order.customer?.email}</div>
                </td>
              )}
              <td className={`${td} whitespace-nowrap font-medium text-ink-900`}>{`${order.make} ${order.model}`}</td>
              <td className={`${td} text-right tabular-nums`}>{order.quantity}</td>
              <td className={`${td} whitespace-nowrap text-right tabular-nums`}>{formatPrice(order.unitPrice)}</td>
              <td className={`${td} whitespace-nowrap text-right font-semibold tabular-nums text-ink-900`}>
                {formatPrice(order.totalPrice)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
