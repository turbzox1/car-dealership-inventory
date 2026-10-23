import { NewVehicle, Vehicle, VehicleSearch, VehicleUpdate } from '../domain/Vehicle';

/** Persistence port for vehicles. */
export interface VehicleRepository {
  create(vehicle: NewVehicle): Promise<Vehicle>;
  findAll(): Promise<Vehicle[]>;
  search(criteria: VehicleSearch): Promise<Vehicle[]>;
  /** Returns null when no vehicle has this id. */
  update(id: string, changes: VehicleUpdate): Promise<Vehicle | null>;
  /** Returns false when no vehicle has this id. */
  delete(id: string): Promise<boolean>;
}
