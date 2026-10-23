import { NewVehicle, Vehicle, VehicleSearch, VehicleUpdate } from '../domain/Vehicle';
import { NotFoundError, ValidationError } from '../domain/errors';
import { VehicleRepository } from '../repositories/VehicleRepository';

/** Vehicle catalogue rules: CRUD and search. Stock changes live in InventoryService. */
export class VehicleService {
  constructor(private readonly vehicles: VehicleRepository) {}

  create(input: NewVehicle): Promise<Vehicle> {
    return this.vehicles.create(input);
  }

  list(): Promise<Vehicle[]> {
    return this.vehicles.findAll();
  }

  async search(criteria: VehicleSearch): Promise<Vehicle[]> {
    const { minPrice, maxPrice } = criteria;
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      throw new ValidationError('minPrice cannot be greater than maxPrice');
    }
    return this.vehicles.search(criteria);
  }

  async update(id: string, changes: VehicleUpdate): Promise<Vehicle> {
    const updated = await this.vehicles.update(id, changes);
    if (!updated) throw new NotFoundError('Vehicle not found');
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.vehicles.delete(id);
    if (!deleted) throw new NotFoundError('Vehicle not found');
  }
}
