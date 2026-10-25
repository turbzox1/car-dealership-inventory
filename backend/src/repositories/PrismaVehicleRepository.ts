import { Prisma, PrismaClient, Vehicle as VehicleRow } from '@prisma/client';
import { FuelType, NewVehicle, Transmission, Vehicle, VehicleImage, VehicleSearch, VehicleUpdate } from '../domain/Vehicle';
import { VehicleRepository } from './VehicleRepository';

/** Prisma returns NUMERIC as Decimal; the API exposes plain numbers. The archive flag stays internal. */
export function toVehicle({ isArchived: _archived, ...row }: VehicleRow): Vehicle {
  return {
    ...row,
    price: row.price.toNumber(),
    // Stored as plain strings/JSON; validated on the way in (API schemas and the curated seed)
    fuelType: row.fuelType as FuelType | null,
    transmission: row.transmission as Transmission | null,
    images: row.images as unknown as VehicleImage[],
  };
}

function isNotFound(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025';
}

/** Archived vehicles are invisible to every query here. */
const ACTIVE = { isArchived: false } as const;

/** Postgres-backed VehicleRepository. */
export class PrismaVehicleRepository implements VehicleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(vehicle: NewVehicle): Promise<Vehicle> {
    return toVehicle(await this.prisma.vehicle.create({ data: vehicle }));
  }

  async findAll(): Promise<Vehicle[]> {
    const rows = await this.prisma.vehicle.findMany({ where: ACTIVE, orderBy: { createdAt: 'desc' } });
    return rows.map(toVehicle);
  }

  async findById(id: string): Promise<Vehicle | null> {
    const row = await this.prisma.vehicle.findFirst({ where: { id, ...ACTIVE } });
    return row ? toVehicle(row) : null;
  }

  async search({ make, model, category, minPrice, maxPrice }: VehicleSearch): Promise<Vehicle[]> {
    // Undefined filters are ignored by Prisma, so every criterion is optional
    const rows = await this.prisma.vehicle.findMany({
      where: {
        ...ACTIVE,
        make: make ? { contains: make, mode: 'insensitive' } : undefined,
        model: model ? { contains: model, mode: 'insensitive' } : undefined,
        category,
        price: { gte: minPrice, lte: maxPrice },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toVehicle);
  }

  async update(id: string, changes: VehicleUpdate): Promise<Vehicle | null> {
    try {
      return toVehicle(await this.prisma.vehicle.update({ where: { id, ...ACTIVE }, data: changes }));
    } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
    }
  }

  /** Soft delete: the row is archived so purchases that reference it remain valid. */
  async delete(id: string): Promise<boolean> {
    const { count } = await this.prisma.vehicle.updateMany({ where: { id, ...ACTIVE }, data: { isArchived: true } });
    return count > 0;
  }
}
