import { CheckoutLine, Order } from '../domain/Order';
import { Purchase } from '../domain/Purchase';
import { Vehicle } from '../domain/Vehicle';
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors';
import { InventoryRepository } from '../repositories/InventoryRepository';

export const MAX_CART_LINES = 20;

export interface PurchaseResult {
  purchase: Purchase;
  vehicle: Vehicle;
}

export interface CheckoutResult {
  order: Order;
  vehicles: Vehicle[];
}

function assertPositiveWholeNumber(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new ValidationError(`${name} must be a positive whole number`);
  }
}

/** Stock rules: purchasing, cart checkout, restocking and order history. */
export class InventoryService {
  constructor(private readonly inventory: InventoryRepository) {}

  async purchase(userId: string, vehicleId: string, quantity = 1): Promise<PurchaseResult> {
    assertPositiveWholeNumber(quantity, 'Quantity');

    // The repository performs check + decrement + record atomically, so concurrent buyers can't oversell
    const outcome = await this.inventory.purchase(userId, vehicleId, quantity);
    switch (outcome.status) {
      case 'not_found':
        throw new NotFoundError('Vehicle not found');
      case 'out_of_stock':
        throw new ConflictError('Not enough stock for this purchase');
      case 'ok':
        return { purchase: outcome.purchase, vehicle: outcome.vehicle };
    }
  }

  async restock(vehicleId: string, amount: number): Promise<Vehicle> {
    assertPositiveWholeNumber(amount, 'Amount');

    const vehicle = await this.inventory.restock(vehicleId, amount);
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    return vehicle;
  }

  /** Buys a whole cart as one order, or nothing at all. */
  async checkout(userId: string, lines: CheckoutLine[]): Promise<CheckoutResult> {
    if (lines.length === 0) throw new ValidationError('Your cart is empty');
    for (const line of lines) assertPositiveWholeNumber(line.quantity, 'Quantity');

    // The same car added twice is one line with the combined quantity
    const merged = new Map<string, number>();
    for (const { vehicleId, quantity } of lines) merged.set(vehicleId, (merged.get(vehicleId) ?? 0) + quantity);
    if (merged.size > MAX_CART_LINES) throw new ValidationError(`A cart can hold up to ${MAX_CART_LINES} different vehicles`);

    const outcome = await this.inventory.checkout(
      userId,
      [...merged].map(([vehicleId, quantity]) => ({ vehicleId, quantity })),
    );
    switch (outcome.status) {
      case 'not_found':
        throw new NotFoundError('A vehicle in your cart is no longer available');
      case 'out_of_stock': {
        const name = `${outcome.make} ${outcome.model}`;
        throw new ConflictError(
          outcome.available === 0 ? `${name} is sold out` : `Not enough stock for ${name} (${outcome.available} left)`,
        );
      }
      case 'ok':
        return { order: outcome.order, vehicles: outcome.vehicles };
    }
  }

  purchasesForUser(userId: string): Promise<Purchase[]> {
    return this.inventory.findPurchasesByUser(userId);
  }

  allPurchases(): Promise<Purchase[]> {
    return this.inventory.findAllPurchases();
  }

  ordersForUser(userId: string): Promise<Order[]> {
    return this.inventory.findOrdersByUser(userId);
  }

  allOrders(): Promise<Order[]> {
    return this.inventory.findAllOrders();
  }
}
