import type { Purchase } from '../types';
import type { ApiCall } from './useApi';

export function fetchMyPurchases(call: ApiCall): Promise<Purchase[]> {
  return call<Purchase[]>('/api/purchases/me');
}

/** Admin only; each purchase includes the customer's name and email. */
export function fetchAllPurchases(call: ApiCall): Promise<Purchase[]> {
  return call<Purchase[]>('/api/purchases');
}
