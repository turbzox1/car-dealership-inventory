import type { CartItem, Order, Vehicle } from '../types';
import type { ApiCall } from './useApi';

export interface CheckoutResult {
  order: Order;
  vehicles: Vehicle[];
}

/** Buys the whole cart as one order, or nothing (409 names the short vehicle). */
export function checkout(call: ApiCall, items: CartItem[]): Promise<CheckoutResult> {
  return call<CheckoutResult>('/api/orders', {
    method: 'POST',
    body: { items: items.map(({ vehicleId, quantity }) => ({ vehicleId, quantity })) },
  });
}

export function fetchMyOrders(call: ApiCall): Promise<Order[]> {
  return call<Order[]>('/api/orders/me');
}

/** Admin only; each order includes the customer's name and email. */
export function fetchAllOrders(call: ApiCall): Promise<Order[]> {
  return call<Order[]>('/api/orders');
}

/** Short, human-friendly order number derived from the id. */
export function orderNumber(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase();
}
