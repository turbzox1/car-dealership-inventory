import { Purchase } from '../domain/Purchase';
import { Vehicle } from '../domain/Vehicle';
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors';
import { InventoryRepository } from '../repositories/InventoryRepository';

export interface PurchaseResult {
  purchase: Purchase;
  vehicle: Vehicle;
}

function assertPositiveWholeNumber(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new ValidationError(`${name} must be a positive whole number`);
  }
}

/** Stock rules: purchasing, restocking and purchase history. */
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

  purchasesForUser(userId: string): Promise<Purchase[]> {
    return this.inventory.findPurchasesByUser(userId);
  }

  allPurchases(): Promise<Purchase[]> {
    return this.inventory.findAllPurchases();
  }
}
