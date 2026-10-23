import { Vehicle } from './Vehicle';

/**
 * A completed purchase. Make, model and unit price are copied from the
 * vehicle at the time of sale, so history stays correct after later
 * price changes or the vehicle being archived.
 */
export interface Purchase {
  id: string;
  userId: string;
  vehicleId: string;
  make: string;
  model: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  purchasedAt: Date;
  /** Present only in the admin-wide listing. */
  customer?: { name: string; email: string };
}

/** Outcome of an atomic stock decrement + purchase insert. */
export type PurchaseOutcome =
  | { status: 'ok'; purchase: Purchase; vehicle: Vehicle }
  | { status: 'not_found' }
  | { status: 'out_of_stock' };
