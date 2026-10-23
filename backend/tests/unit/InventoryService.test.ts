import { InventoryService } from '../../src/services/InventoryService';
import { InMemoryInventoryRepository } from '../fakes/InMemoryInventoryRepository';
import { ConflictError, NotFoundError, ValidationError } from '../../src/domain/errors';

describe('InventoryService', () => {
  let repo: InMemoryInventoryRepository;
  let service: InventoryService;

  beforeEach(() => {
    repo = new InMemoryInventoryRepository();
    service = new InventoryService(repo);
  });

  describe('purchase', () => {
    it('buys one unit by default, decreasing stock and recording the purchase', async () => {
      const vehicle = repo.addVehicle({ quantity: 3, price: 24000 });

      const result = await service.purchase('user-1', vehicle.id);

      expect(result.vehicle.quantity).toBe(2);
      expect(result.purchase).toMatchObject({
        userId: 'user-1', vehicleId: vehicle.id, quantity: 1, unitPrice: 24000, totalPrice: 24000,
      });
    });

    it('buys several units at once', async () => {
      const vehicle = repo.addVehicle({ quantity: 3, price: 10000 });

      const result = await service.purchase('user-1', vehicle.id, 2);

      expect(result.vehicle.quantity).toBe(1);
      expect(result.purchase.totalPrice).toBe(20000);
    });

    it('throws ConflictError when stock is insufficient, leaving stock unchanged', async () => {
      const vehicle = repo.addVehicle({ quantity: 1 });

      await expect(service.purchase('user-1', vehicle.id, 2)).rejects.toThrow(ConflictError);
      expect(repo.vehicles[0].quantity).toBe(1);
      expect(repo.purchases).toHaveLength(0);
    });

    it('throws ConflictError when the vehicle is out of stock', async () => {
      const vehicle = repo.addVehicle({ quantity: 0 });

      await expect(service.purchase('user-1', vehicle.id)).rejects.toThrow(ConflictError);
    });

    it('throws NotFoundError for an unknown vehicle', async () => {
      await expect(service.purchase('user-1', 'missing-id')).rejects.toThrow(NotFoundError);
    });

    it.each([0, -1, 1.5])('rejects quantity %p with ValidationError', async (quantity) => {
      const vehicle = repo.addVehicle({ quantity: 5 });

      await expect(service.purchase('user-1', vehicle.id, quantity)).rejects.toThrow(ValidationError);
    });
  });

  describe('restock', () => {
    it('increases stock by the given amount', async () => {
      const vehicle = repo.addVehicle({ quantity: 0 });

      const updated = await service.restock(vehicle.id, 5);

      expect(updated.quantity).toBe(5);
    });

    it('throws NotFoundError for an unknown vehicle', async () => {
      await expect(service.restock('missing-id', 5)).rejects.toThrow(NotFoundError);
    });

    it.each([0, -3, 2.5])('rejects amount %p with ValidationError', async (amount) => {
      const vehicle = repo.addVehicle();

      await expect(service.restock(vehicle.id, amount)).rejects.toThrow(ValidationError);
    });
  });

  describe('purchase history', () => {
    it("returns only the caller's own purchases", async () => {
      const vehicle = repo.addVehicle({ quantity: 5 });
      await service.purchase('user-1', vehicle.id);
      await service.purchase('user-2', vehicle.id);

      const mine = await service.purchasesForUser('user-1');

      expect(mine).toHaveLength(1);
      expect(mine[0].userId).toBe('user-1');
    });

    it('returns every purchase for the admin listing', async () => {
      const vehicle = repo.addVehicle({ quantity: 5 });
      await service.purchase('user-1', vehicle.id);
      await service.purchase('user-2', vehicle.id);

      expect(await service.allPurchases()).toHaveLength(2);
    });
  });
});
