import { InventoryService } from '../../src/services/InventoryService';
import { InMemoryInventoryRepository } from '../fakes/InMemoryInventoryRepository';
import { ConflictError, NotFoundError, ValidationError } from '../../src/domain/errors';

describe('InventoryService.checkout', () => {
  let repo: InMemoryInventoryRepository;
  let service: InventoryService;

  beforeEach(() => {
    repo = new InMemoryInventoryRepository();
    service = new InventoryService(repo);
  });

  it('buys every line as one order with a total', async () => {
    const civic = repo.addVehicle({ model: 'Civic', price: 24000, quantity: 3 });
    const crv = repo.addVehicle({ model: 'CR-V', price: 32000, quantity: 2 });

    const { order, vehicles } = await service.checkout('user-1', [
      { vehicleId: civic.id, quantity: 2 },
      { vehicleId: crv.id, quantity: 1 },
    ]);

    expect(order.items).toHaveLength(2);
    expect(order.total).toBe(80000);
    expect(vehicles.map((v) => v.quantity).sort()).toEqual([1, 1]);
  });

  it('merges repeated lines for the same vehicle', async () => {
    const civic = repo.addVehicle({ quantity: 5 });

    await service.checkout('user-1', [
      { vehicleId: civic.id, quantity: 1 },
      { vehicleId: civic.id, quantity: 2 },
    ]);

    expect(repo.lastCheckoutLines).toEqual([{ vehicleId: civic.id, quantity: 3 }]);
  });

  it('buys nothing and names the vehicle when one line is short', async () => {
    const civic = repo.addVehicle({ make: 'Honda', model: 'Civic', quantity: 3 });
    const golf = repo.addVehicle({ make: 'Volkswagen', model: 'Golf', quantity: 1 });

    await expect(
      service.checkout('user-1', [
        { vehicleId: civic.id, quantity: 1 },
        { vehicleId: golf.id, quantity: 2 },
      ]),
    ).rejects.toThrow(new ConflictError('Not enough stock for Volkswagen Golf (1 left)'));

    expect(civic.quantity).toBe(3);
    expect(repo.orders).toHaveLength(0);
  });

  it('says when a vehicle is sold out', async () => {
    const golf = repo.addVehicle({ make: 'Volkswagen', model: 'Golf', quantity: 0 });

    await expect(service.checkout('user-1', [{ vehicleId: golf.id, quantity: 1 }])).rejects.toThrow(
      'Volkswagen Golf is sold out',
    );
  });

  it('throws NotFoundError for an unknown vehicle', async () => {
    await expect(service.checkout('user-1', [{ vehicleId: 'missing', quantity: 1 }])).rejects.toThrow(NotFoundError);
  });

  it.each([
    ['an empty cart', []],
    ['a zero quantity', [{ vehicleId: 'v', quantity: 0 }]],
    ['a fractional quantity', [{ vehicleId: 'v', quantity: 1.5 }]],
    ['more than 20 different vehicles', Array.from({ length: 21 }, (_, i) => ({ vehicleId: `v${i}`, quantity: 1 }))],
  ])('rejects %s with ValidationError', async (_case, lines) => {
    await expect(service.checkout('user-1', lines)).rejects.toThrow(ValidationError);
  });

  it('records a single Purchase as a one-line order', async () => {
    const civic = repo.addVehicle({ quantity: 2 });

    const { purchase } = await service.purchase('user-1', civic.id);

    const [order] = await service.ordersForUser('user-1');
    expect(order.items).toHaveLength(1);
    expect(purchase.orderId).toBe(order.id);
  });

  it("lists only the caller's orders, and every order for admins", async () => {
    const civic = repo.addVehicle({ quantity: 5 });
    await service.checkout('user-1', [{ vehicleId: civic.id, quantity: 1 }]);
    await service.checkout('user-2', [{ vehicleId: civic.id, quantity: 1 }]);

    expect(await service.ordersForUser('user-1')).toHaveLength(1);
    expect(await service.allOrders()).toHaveLength(2);
  });
});
