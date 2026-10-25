import { Prisma, PrismaClient, Vehicle as VehicleRow } from '@prisma/client';
import { CheckoutLine, CheckoutOutcome, Order } from '../domain/Order';
import { Purchase, PurchaseOutcome } from '../domain/Purchase';
import { Vehicle } from '../domain/Vehicle';
import { InventoryRepository } from './InventoryRepository';
import { toVehicle } from './PrismaVehicleRepository';

type PurchaseRow = Prisma.PurchaseGetPayload<object> & { user?: { name: string; email: string } };
type OrderRow = Prisma.OrderGetPayload<{ include: { purchases: true } }> & { user?: { name: string; email: string } };

function toPurchase({ user, ...row }: PurchaseRow): Purchase {
  const unitPrice = row.unitPrice.toNumber();
  return {
    ...row,
    unitPrice,
    totalPrice: row.unitPrice.times(row.quantity).toNumber(),
    ...(user && { customer: { name: user.name, email: user.email } }),
  };
}

function toOrder({ user, purchases, ...row }: OrderRow): Order {
  const total = purchases.reduce((sum, p) => sum.plus(p.unitPrice.times(p.quantity)), new Prisma.Decimal(0));
  return {
    id: row.id,
    userId: row.userId,
    createdAt: row.createdAt,
    total: total.toNumber(),
    items: purchases.map((p) => ({
      vehicleId: p.vehicleId,
      make: p.make,
      model: p.model,
      quantity: p.quantity,
      unitPrice: p.unitPrice.toNumber(),
      totalPrice: p.unitPrice.times(p.quantity).toNumber(),
    })),
    ...(user && { customer: { name: user.name, email: user.email } }),
  };
}

/** Thrown inside the checkout transaction to roll it back and report why. */
class CheckoutRejected extends Error {
  constructor(readonly outcome: Exclude<CheckoutOutcome, { status: 'ok' }>) {
    super(outcome.status);
  }
}

const ORDER_LINES = { purchases: { orderBy: { id: 'asc' } } } as const;
const CUSTOMER = { user: { select: { name: true, email: true } } } as const;

/** Postgres-backed InventoryRepository. */
export class PrismaInventoryRepository implements InventoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async purchase(userId: string, vehicleId: string, quantity: number): Promise<PurchaseOutcome> {
    const result = await this.runCheckout(userId, [{ vehicleId, quantity }]);
    if (result.status !== 'ok') return { status: result.status };
    return { status: 'ok', purchase: toPurchase(result.row.purchases[0]), vehicle: toVehicle(result.vehicles[0]) };
  }

  async checkout(userId: string, lines: CheckoutLine[]): Promise<CheckoutOutcome> {
    const result = await this.runCheckout(userId, lines);
    if (result.status !== 'ok') return result;
    return { status: 'ok', order: toOrder(result.row), vehicles: result.vehicles.map(toVehicle) };
  }

  /**
   * One transaction for the whole cart. Each line is a conditional UPDATE
   * (quantity >= n), so Postgres row locks serialize competing buyers. Lines
   * are processed in vehicle-id order: every transaction takes its locks in
   * the same order, so two carts holding the same cars can't deadlock.
   * Any short line throws, rolling back the lines already decremented.
   */
  private async runCheckout(
    userId: string,
    lines: CheckoutLine[],
  ): Promise<
    | { status: 'ok'; row: OrderRow; vehicles: VehicleRow[] }
    | Exclude<CheckoutOutcome, { status: 'ok' }>
  > {
    const lockOrder = [...lines].sort((a, b) => (a.vehicleId < b.vehicleId ? -1 : a.vehicleId > b.vehicleId ? 1 : 0));
    try {
      return await this.prisma.$transaction(async (tx) => {
        for (const { vehicleId, quantity } of lockOrder) {
          const { count } = await tx.vehicle.updateMany({
            where: { id: vehicleId, isArchived: false, quantity: { gte: quantity } },
            data: { quantity: { decrement: quantity } },
          });
          if (count === 0) {
            const vehicle = await tx.vehicle.findFirst({ where: { id: vehicleId, isArchived: false } });
            throw new CheckoutRejected(
              vehicle
                ? { status: 'out_of_stock', vehicleId, make: vehicle.make, model: vehicle.model, available: vehicle.quantity }
                : { status: 'not_found', vehicleId },
            );
          }
        }

        // Read back after our own updates: prices and stock as of this sale
        const rows = await tx.vehicle.findMany({ where: { id: { in: lines.map((l) => l.vehicleId) } } });
        const byId = new Map(rows.map((v) => [v.id, v]));
        const row = await tx.order.create({
          data: {
            userId,
            purchases: {
              create: lines.map(({ vehicleId, quantity }) => {
                const vehicle = byId.get(vehicleId)!;
                return { userId, vehicleId, quantity, make: vehicle.make, model: vehicle.model, unitPrice: vehicle.price };
              }),
            },
          },
          include: ORDER_LINES,
        });
        return { status: 'ok' as const, row, vehicles: lines.map((l) => byId.get(l.vehicleId)!) };
      });
    } catch (err) {
      if (err instanceof CheckoutRejected) return err.outcome;
      throw err;
    }
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
    const rows = await this.prisma.purchase.findMany({ include: CUSTOMER, orderBy: { purchasedAt: 'desc' } });
    return rows.map(toPurchase);
  }

  async findOrdersByUser(userId: string): Promise<Order[]> {
    const rows = await this.prisma.order.findMany({
      where: { userId },
      include: ORDER_LINES,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    return rows.map(toOrder);
  }

  async findAllOrders(): Promise<Order[]> {
    const rows = await this.prisma.order.findMany({
      include: { ...ORDER_LINES, ...CUSTOMER },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    return rows.map(toOrder);
  }
}
