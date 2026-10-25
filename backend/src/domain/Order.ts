import { Vehicle } from './Vehicle';

/** One line of an order, priced as it was at the time of sale. */
export interface OrderItem {
  vehicleId: string;
  make: string;
  model: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/** A checkout: several lines from a cart, or a single line from "Purchase". */
export interface Order {
  id: string;
  userId: string;
  createdAt: Date;
  total: number;
  items: OrderItem[];
  /** Present only in the admin-wide listing. */
  customer?: { name: string; email: string };
}

export interface CheckoutLine {
  vehicleId: string;
  quantity: number;
}

/** Outcome of an all-or-nothing checkout; any failure means nothing was bought. */
export type CheckoutOutcome =
  | { status: 'ok'; order: Order; vehicles: Vehicle[] }
  | { status: 'not_found'; vehicleId: string }
  | { status: 'out_of_stock'; vehicleId: string; make: string; model: string; available: number };
