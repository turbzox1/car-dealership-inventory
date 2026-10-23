import { VehicleService } from '../../src/services/VehicleService';
import { InMemoryVehicleRepository } from '../fakes/InMemoryVehicleRepository';
import { NotFoundError, ValidationError } from '../../src/domain/errors';
import { NewVehicle } from '../../src/domain/Vehicle';

const civic: NewVehicle = { make: 'Honda', model: 'Civic', category: 'SEDAN', price: 24000, quantity: 3 };

describe('VehicleService', () => {
  let repo: InMemoryVehicleRepository;
  let service: VehicleService;

  beforeEach(() => {
    repo = new InMemoryVehicleRepository();
    service = new VehicleService(repo);
  });

  it('creates a vehicle with an id', async () => {
    const vehicle = await service.create(civic);

    expect(vehicle).toMatchObject(civic);
    expect(vehicle.id).toEqual(expect.any(String));
  });

  it('lists all vehicles, including out-of-stock ones', async () => {
    await service.create(civic);
    await service.create({ ...civic, model: 'Accord', quantity: 0 });

    const vehicles = await service.list();

    expect(vehicles.map((v) => v.model)).toEqual(expect.arrayContaining(['Civic', 'Accord']));
  });

  describe('search', () => {
    it('passes the criteria to the repository', async () => {
      await service.search({ make: 'honda', minPrice: 1000 });

      expect(repo.lastSearch).toEqual({ make: 'honda', minPrice: 1000 });
    });

    it('rejects a price range where minPrice is above maxPrice', async () => {
      await expect(service.search({ minPrice: 50000, maxPrice: 10000 })).rejects.toThrow(ValidationError);
    });
  });

  describe('update', () => {
    it('updates the given details', async () => {
      const { id } = await service.create(civic);

      const updated = await service.update(id, { price: 22500 });

      expect(updated).toMatchObject({ id, price: 22500, model: 'Civic' });
    });

    it('throws NotFoundError for an unknown id', async () => {
      await expect(service.update('missing-id', { price: 1 })).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('removes the vehicle', async () => {
      const { id } = await service.create(civic);

      await service.delete(id);

      expect(await service.list()).toHaveLength(0);
    });

    it('throws NotFoundError for an unknown id', async () => {
      await expect(service.delete('missing-id')).rejects.toThrow(NotFoundError);
    });
  });
});
