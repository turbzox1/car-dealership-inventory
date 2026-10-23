import { Prisma, PrismaClient } from '@prisma/client';
import { Purchase, PurchaseOutcome } from '../domain/Purchase';
import { Vehicle } from '../domain/Vehicle';
import { InventoryRepository } from './InventoryRepository';
import { toVehicle } from './PrismaVehicleRepository';

type PurchaseRow = Prisma.PurchaseGetPayload<object> & { user?: { name: string; email: string } };

function toPurchase({ user, ...row }: PurchaseRow): Purchase {
  const unitPrice = row.unitPrice.toNumber();
  return {
    ...row,
    unitPrice,
    totalPrice: row.unitPrice.times(row.quantity).toNumber(),
    ...(user && { customer: { name: user.name, email: user.email } }),
  };
}

/** Postgres-backed InventoryRepository. */
export class PrismaInventoryRepository implements InventoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async purchase(userId: string, vehicleId: string, quantity: number): Promise<PurchaseOutcome> {
    return this.prisma.$transaction(async (tx) => {
      // One conditional UPDATE: Postgres locks the row, so a concurrent buyer waits,
      // then re-checks `quantity >= n` against the new value and matches nothing.
      const { count } = await tx.vehicle.updateMany({
        where: { id: vehicleId, isArchived: false, quantity: { gte: quantity } },
        data: { quantity: { decrement: quantity } },
      });

      if (count === 0) {
        const exists = await tx.vehicle.count({ where: { id: vehicleId, isArchived: false } });
        return exists ? { status: 'out_of_stock' } : { status: 'not_found' };
      }

      const vehicle = await tx.vehicle.findUniqueOrThrow({ where: { id: vehicleId } });
      const purchase = await tx.purchase.create({
        data: { userId, vehicleId, quantity, make: vehicle.make, model: vehicle.model, unitPrice: vehicle.price },
      });
      return { status: 'ok', purchase: toPurchase(purchase), vehicle: toVehicle(vehicle) };
    });
  }

  async restock(vehicleId: string, amount: number): Promise<Vehicle | null> {
    // Atomic increment, so a concurrent purchase or restock can't be lost
    const { count } = await this.prisma.vehicle.updateMany({
      where: { id: vehicleId, isArchived: false },
      data: { quantity: { increment: amount } },
    });
    if (count === 0) return null;
    return toVehicle(await this.prisma.vehicle.findUniqueOrThrow({ where: { id: vehicleId } }));
  }

  async findPurchasesByUser(userId: string): Promise<Purchase[]> {
    const rows = await this.prisma.purchase.findMany({ where: { userId }, orderBy: { purchasedAt: 'desc' } });
    return rows.map(toPurchase);
  }

  async findAllPurchases(): Promise<Purchase[]> {
    const rows = await this.prisma.purchase.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { purchasedAt: 'desc' },
    });
    return rows.map(toPurchase);
  }
}
