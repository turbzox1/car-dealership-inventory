import { Purchase, PurchaseOutcome } from '../domain/Purchase';
import { Vehicle } from '../domain/Vehicle';

/**
 * Persistence port for stock changes and purchase history.
 * Implementations must make `purchase` atomic: the stock check, decrement
 * and purchase record happen together or not at all, even under concurrency.
 */
export interface InventoryRepository {
  purchase(userId: string, vehicleId: string, quantity: number): Promise<PurchaseOutcome>;
  /** Returns null when the vehicle does not exist or is archived. */
  restock(vehicleId: string, amount: number): Promise<Vehicle | null>;
  findPurchasesByUser(userId: string): Promise<Purchase[]>;
  findAllPurchases(): Promise<Purchase[]>;
}
