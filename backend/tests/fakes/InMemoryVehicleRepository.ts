import { randomUUID } from 'crypto';
import { NewVehicle, Vehicle, VehicleSearch, VehicleUpdate } from '../../src/domain/Vehicle';
import { VehicleRepository } from '../../src/repositories/VehicleRepository';

/** Test double for unit tests; real filtering is covered by integration tests. */
export class InMemoryVehicleRepository implements VehicleRepository {
  vehicles: Vehicle[] = [];
  lastSearch?: VehicleSearch;

  async create(input: NewVehicle): Promise<Vehicle> {
    const now = new Date();
    const vehicle: Vehicle = { id: randomUUID(), createdAt: now, updatedAt: now, ...input };
    this.vehicles.push(vehicle);
    return vehicle;
  }

  async findAll(): Promise<Vehicle[]> {
    return [...this.vehicles];
  }

  async search(criteria: VehicleSearch): Promise<Vehicle[]> {
    this.lastSearch = criteria;
    return [...this.vehicles];
  }

  async update(id: string, changes: VehicleUpdate): Promise<Vehicle | null> {
    const vehicle = this.vehicles.find((v) => v.id === id);
    if (!vehicle) return null;
    Object.assign(vehicle, changes, { updatedAt: new Date() });
    return vehicle;
  }

  async delete(id: string): Promise<boolean> {
    const before = this.vehicles.length;
    this.vehicles = this.vehicles.filter((v) => v.id !== id);
    return this.vehicles.length < before;
  }
}
