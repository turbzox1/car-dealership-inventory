import { randomUUID } from 'crypto';
import { CheckoutLine, CheckoutOutcome, Order } from '../../src/domain/Order';
import { Purchase, PurchaseOutcome } from '../../src/domain/Purchase';
import { Vehicle } from '../../src/domain/Vehicle';
import { InventoryRepository } from '../../src/repositories/InventoryRepository';

/** Single-threaded test double; real atomicity is covered by integration tests. */
export class InMemoryInventoryRepository implements InventoryRepository {
  vehicles: Vehicle[] = [];
  purchases: Purchase[] = [];
  orders: Order[] = [];
  /** Lines received by the last checkout call, to assert what the service sent. */
  lastCheckoutLines?: CheckoutLine[];

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
    const outcome = await this.checkout(userId, [{ vehicleId, quantity }]);
    if (outcome.status === 'not_found') return { status: 'not_found' };
    if (outcome.status === 'out_of_stock') return { status: 'out_of_stock' };
    const purchase = this.purchases.find((p) => p.orderId === outcome.order.id)!;
    return { status: 'ok', purchase, vehicle: outcome.vehicles[0] };
  }

  async checkout(userId: string, lines: CheckoutLine[]): Promise<CheckoutOutcome> {
    this.lastCheckoutLines = lines;
    // Check every line before changing anything: all or nothing
    for (const line of lines) {
      const vehicle = this.vehicles.find((v) => v.id === line.vehicleId);
      if (!vehicle) return { status: 'not_found', vehicleId: line.vehicleId };
      if (vehicle.quantity < line.quantity) {
        return { status: 'out_of_stock', vehicleId: vehicle.id, make: vehicle.make, model: vehicle.model, available: vehicle.quantity };
      }
    }

    const order: Order = { id: randomUUID(), userId, createdAt: new Date(), total: 0, items: [] };
    const updated: Vehicle[] = [];
    for (const line of lines) {
      const vehicle = this.vehicles.find((v) => v.id === line.vehicleId)!;
      vehicle.quantity -= line.quantity;
      const totalPrice = vehicle.price * line.quantity;
      order.items.push({
        vehicleId: vehicle.id, make: vehicle.make, model: vehicle.model,
        quantity: line.quantity, unitPrice: vehicle.price, totalPrice,
      });
      order.total += totalPrice;
      this.purchases.push({
        id: randomUUID(), orderId: order.id, userId, vehicleId: vehicle.id, make: vehicle.make, model: vehicle.model,
        quantity: line.quantity, unitPrice: vehicle.price, totalPrice, purchasedAt: order.createdAt,
      });
      updated.push({ ...vehicle });
    }
    this.orders.push(order);
    return { status: 'ok', order, vehicles: updated };
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

  async findOrdersByUser(userId: string): Promise<Order[]> {
    return this.orders.filter((o) => o.userId === userId);
  }

  async findAllOrders(): Promise<Order[]> {
    return [...this.orders];
  }
}
