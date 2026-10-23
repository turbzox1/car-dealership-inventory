import { randomUUID } from 'crypto';
import { Purchase, PurchaseOutcome } from '../../src/domain/Purchase';
import { Vehicle } from '../../src/domain/Vehicle';
import { InventoryRepository } from '../../src/repositories/InventoryRepository';

/** Single-threaded test double; real atomicity is covered by integration tests. */
export class InMemoryInventoryRepository implements InventoryRepository {
  vehicles: Vehicle[] = [];
  purchases: Purchase[] = [];

  addVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
    const now = new Date();
    const vehicle: Vehicle = {
      id: randomUUID(), make: 'Honda', model: 'Civic', category: 'SEDAN',
      price: 24000, quantity: 1, createdAt: now, updatedAt: now, ...overrides,
    };
    this.vehicles.push(vehicle);
    return vehicle;
  }

  async purchase(userId: string, vehicleId: string, quantity: number): Promise<PurchaseOutcome> {
    const vehicle = this.vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return { status: 'not_found' };
    if (vehicle.quantity < quantity) return { status: 'out_of_stock' };

    vehicle.quantity -= quantity;
    const purchase: Purchase = {
      id: randomUUID(), userId, vehicleId, make: vehicle.make, model: vehicle.model,
      quantity, unitPrice: vehicle.price, totalPrice: vehicle.price * quantity, purchasedAt: new Date(),
    };
    this.purchases.push(purchase);
    return { status: 'ok', purchase, vehicle: { ...vehicle } };
  }

  async restock(vehicleId: string, amount: number): Promise<Vehicle | null> {
    const vehicle = this.vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return null;
    vehicle.quantity += amount;
    return { ...vehicle };
  }

  async findPurchasesByUser(userId: string): Promise<Purchase[]> {
    return this.purchases.filter((p) => p.userId === userId);
  }

  async findAllPurchases(): Promise<Purchase[]> {
    return [...this.purchases];
  }
}
