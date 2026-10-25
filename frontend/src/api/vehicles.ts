import type { Vehicle, VehicleFilters } from '../types';
import type { ApiCall } from './useApi';

export function hasActiveFilters(filters: VehicleFilters): boolean {
  return Object.values(filters).some((value) => value.trim() !== '');
}

/** All vehicles when no filter is set, otherwise the search endpoint with only the filters in use. */
export function fetchVehicles(call: ApiCall, filters: VehicleFilters): Promise<Vehicle[]> {
  if (!hasActiveFilters(filters)) return call<Vehicle[]>('/api/vehicles');

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value.trim() !== '') params.set(key, value.trim());
  }
  return call<Vehicle[]>(`/api/vehicles/search?${params}`);
}

export function fetchVehicle(call: ApiCall, id: string): Promise<Vehicle> {
  return call<Vehicle>(`/api/vehicles/${encodeURIComponent(id)}`);
}

export interface PurchaseResult {
  purchase: { id: string; quantity: number; totalPrice: number };
  vehicle: Vehicle;
}

export function purchaseVehicle(call: ApiCall, id: string, quantity = 1): Promise<PurchaseResult> {
  return call<PurchaseResult>(`/api/vehicles/${encodeURIComponent(id)}/purchase`, {
    method: 'POST',
    body: { quantity },
  });
}
