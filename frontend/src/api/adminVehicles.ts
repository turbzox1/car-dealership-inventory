import type { Category, Vehicle } from '../types';
import type { ApiCall } from './useApi';

export interface VehicleDetails {
  make: string;
  model: string;
  category: Category;
  price: number;
}

export interface NewVehicle extends VehicleDetails {
  quantity: number;
}

const vehiclePath = (id: string) => `/api/vehicles/${encodeURIComponent(id)}`;

export function createVehicle(call: ApiCall, vehicle: NewVehicle): Promise<Vehicle> {
  return call<Vehicle>('/api/vehicles', { method: 'POST', body: vehicle });
}

/** Quantity is deliberately not editable here; the API only changes stock through purchase/restock. */
export function updateVehicle(call: ApiCall, id: string, details: VehicleDetails): Promise<Vehicle> {
  return call<Vehicle>(vehiclePath(id), { method: 'PUT', body: details });
}

/** The API archives rather than deletes, so purchase history stays intact. */
export function deleteVehicle(call: ApiCall, id: string): Promise<void> {
  return call<void>(vehiclePath(id), { method: 'DELETE' });
}

export function restockVehicle(call: ApiCall, id: string, amount: number): Promise<Vehicle> {
  return call<Vehicle>(`${vehiclePath(id)}/restock`, { method: 'POST', body: { amount } });
}
