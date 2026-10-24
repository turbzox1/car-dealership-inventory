import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { NewVehicle } from '../domain/Vehicle';
import { registerSchema } from '../validation/authSchemas';

export interface SeedOptions {
  adminEmail: string;
  adminPassword: string;
}

/** Same email/password rules as registration, so the admin can log in normally. */
const seedOptionsSchema = z.object({
  adminEmail: registerSchema.shape.email,
  adminPassword: registerSchema.shape.password,
});

const SAMPLE_VEHICLES: NewVehicle[] = [
  { make: 'Toyota', model: 'Camry', category: 'SEDAN', price: 28400, quantity: 5 },
  { make: 'Honda', model: 'Civic', category: 'SEDAN', price: 24650, quantity: 3 },
  { make: 'Honda', model: 'CR-V', category: 'SUV', price: 32150, quantity: 4 },
  { make: 'Ford', model: 'F-150', category: 'TRUCK', price: 45900, quantity: 2 },
  { make: 'Tesla', model: 'Model 3', category: 'EV', price: 41990, quantity: 6 },
  { make: 'Volkswagen', model: 'Golf', category: 'HATCHBACK', price: 23900, quantity: 0 },
  { make: 'BMW', model: '4 Series', category: 'COUPE', price: 52300, quantity: 1 },
  { make: 'Mazda', model: 'MX-5 Miata', category: 'CONVERTIBLE', price: 31500, quantity: 2 },
  { make: 'Chrysler', model: 'Pacifica', category: 'VAN', price: 40500, quantity: 1 },
];

/**
 * Idempotent seed: ensures one admin account exists and fills an empty
 * catalogue with sample vehicles. Safe to run on every deploy.
 */
export async function seedDatabase(prisma: PrismaClient, options: SeedOptions): Promise<void> {
  const { adminEmail, adminPassword } = seedOptionsSchema.parse(options);

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    // Promote only; never overwrite a password someone may have changed
    await prisma.user.update({ where: { id: existing.id }, data: { role: 'ADMIN' } });
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({ data: { name: 'Admin', email: adminEmail, passwordHash, role: 'ADMIN' } });
  }

  if ((await prisma.vehicle.count()) === 0) {
    await prisma.vehicle.createMany({ data: SAMPLE_VEHICLES });
  }
}
