import { Prisma, PrismaClient, Vehicle as VehicleRow } from '@prisma/client';
import { NewVehicle, Vehicle, VehicleSearch, VehicleUpdate } from '../domain/Vehicle';
import { VehicleRepository } from './VehicleRepository';

/** Prisma returns NUMERIC as Decimal; the API exposes plain numbers. */
function toVehicle(row: VehicleRow): Vehicle {
  return { ...row, price: row.price.toNumber() };
}

function isNotFound(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025';
}

/** Postgres-backed VehicleRepository. */
export class PrismaVehicleRepository implements VehicleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(vehicle: NewVehicle): Promise<Vehicle> {
    return toVehicle(await this.prisma.vehicle.create({ data: vehicle }));
  }

  async findAll(): Promise<Vehicle[]> {
    const rows = await this.prisma.vehicle.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(toVehicle);
  }

  async search({ make, model, category, minPrice, maxPrice }: VehicleSearch): Promise<Vehicle[]> {
    // Undefined filters are ignored by Prisma, so every criterion is optional
    const rows = await this.prisma.vehicle.findMany({
      where: {
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
      return toVehicle(await this.prisma.vehicle.update({ where: { id }, data: changes }));
    } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.vehicle.delete({ where: { id } });
      return true;
    } catch (err) {
      if (isNotFound(err)) return false;
      throw err;
    }
  }
}
