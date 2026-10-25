import { CheckoutLine, CheckoutOutcome, Order } from '../domain/Order';
import { Purchase, PurchaseOutcome } from '../domain/Purchase';
import { Vehicle } from '../domain/Vehicle';

/**
 * Persistence port for stock changes and order history.
 * Implementations must make `purchase` and `checkout` atomic: stock checks,
 * decrements and the order record happen together or not at all, even under
 * concurrency.
 */
export interface InventoryRepository {
  /** Buys one vehicle; recorded as an order with a single line. */
  purchase(userId: string, vehicleId: string, quantity: number): Promise<PurchaseOutcome>;
  /** Buys every line or none. Lines must have distinct vehicle ids. */
  checkout(userId: string, lines: CheckoutLine[]): Promise<CheckoutOutcome>;
  /** Returns null when the vehicle does not exist or is archived. */
  restock(vehicleId: string, amount: number): Promise<Vehicle | null>;
  findPurchasesByUser(userId: string): Promise<Purchase[]>;
  findAllPurchases(): Promise<Purchase[]>;
  findOrdersByUser(userId: string): Promise<Order[]>;
  /** Every order, with the customer's name and email. */
  findAllOrders(): Promise<Order[]>;
}
