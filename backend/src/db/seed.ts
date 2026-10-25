import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { MIN_ADMIN_PASSWORD_LENGTH, secretProblems } from '../config';
import { NewVehicle } from '../domain/Vehicle';
import { registerSchema } from '../validation/authSchemas';

export interface SeedOptions {
  adminEmail: string;
  adminPassword: string;
}

/** Registration rules plus the stricter admin-password rules, enforced even when called directly. */
const seedOptionsSchema = z.object({
  adminEmail: registerSchema.shape.email,
  adminPassword: registerSchema.shape.password.superRefine((password, ctx) => {
    for (const message of secretProblems('ADMIN_PASSWORD', password, MIN_ADMIN_PASSWORD_LENGTH)) {
      ctx.addIssue({ code: 'custom', message });
    }
  }),
});

const SAMPLE_VEHICLES: NewVehicle[] = [
  // Sedans
  { make: 'Toyota', model: 'Camry', category: 'SEDAN', price: 28400, quantity: 5 },
  { make: 'Honda', model: 'Civic', category: 'SEDAN', price: 24650, quantity: 3 },
  { make: 'Hyundai', model: 'Sonata', category: 'SEDAN', price: 27500, quantity: 4 },
  { make: 'BMW', model: '3 Series', category: 'SEDAN', price: 46200, quantity: 2 },
  { make: 'Mercedes-Benz', model: 'C-Class', category: 'SEDAN', price: 48950, quantity: 1 },
  // SUVs
  { make: 'Honda', model: 'CR-V', category: 'SUV', price: 32150, quantity: 4 },
  { make: 'Toyota', model: 'RAV4', category: 'SUV', price: 31275, quantity: 6 },
  { make: 'Mazda', model: 'CX-5', category: 'SUV', price: 30900, quantity: 3 },
  { make: 'Kia', model: 'Telluride', category: 'SUV', price: 39890, quantity: 0 },
  { make: 'Jeep', model: 'Grand Cherokee', category: 'SUV', price: 42995, quantity: 2 },
  { make: 'Volvo', model: 'XC90', category: 'SUV', price: 59750, quantity: 1 },
  // Trucks
  { make: 'Ford', model: 'F-150', category: 'TRUCK', price: 45900, quantity: 2 },
  { make: 'Chevrolet', model: 'Silverado 1500', category: 'TRUCK', price: 43600, quantity: 3 },
  { make: 'Ram', model: '1500', category: 'TRUCK', price: 44850, quantity: 1 },
  { make: 'Toyota', model: 'Tacoma', category: 'TRUCK', price: 34500, quantity: 4 },
  // Hatchbacks
  { make: 'Volkswagen', model: 'Golf', category: 'HATCHBACK', price: 23900, quantity: 0 },
  { make: 'Mazda', model: 'Mazda3 Hatchback', category: 'HATCHBACK', price: 26250, quantity: 3 },
  { make: 'Toyota', model: 'GR Corolla', category: 'HATCHBACK', price: 38960, quantity: 1 },
  { make: 'Honda', model: 'Civic Type R', category: 'HATCHBACK', price: 45890, quantity: 2 },
  // Coupes
  { make: 'BMW', model: '4 Series', category: 'COUPE', price: 52300, quantity: 1 },
  { make: 'Ford', model: 'Mustang', category: 'COUPE', price: 32515, quantity: 4 },
  { make: 'Chevrolet', model: 'Corvette Stingray', category: 'COUPE', price: 69995, quantity: 1 },
  { make: 'Toyota', model: 'GR86', category: 'COUPE', price: 30200, quantity: 2 },
  // Convertibles
  { make: 'Mazda', model: 'MX-5 Miata', category: 'CONVERTIBLE', price: 31500, quantity: 2 },
  { make: 'Porsche', model: '718 Boxster', category: 'CONVERTIBLE', price: 74850, quantity: 1 },
  { make: 'BMW', model: 'Z4', category: 'CONVERTIBLE', price: 54900, quantity: 0 },
  { make: 'Mini', model: 'Cooper Convertible', category: 'CONVERTIBLE', price: 34400, quantity: 3 },
  // Vans
  { make: 'Chrysler', model: 'Pacifica', category: 'VAN', price: 40500, quantity: 1 },
  { make: 'Honda', model: 'Odyssey', category: 'VAN', price: 39900, quantity: 2 },
  { make: 'Toyota', model: 'Sienna', category: 'VAN', price: 39185, quantity: 3 },
  { make: 'Kia', model: 'Carnival', category: 'VAN', price: 35990, quantity: 2 },
  // Electric
  { make: 'Tesla', model: 'Model 3', category: 'EV', price: 41990, quantity: 6 },
  { make: 'Tesla', model: 'Model Y', category: 'EV', price: 44990, quantity: 4 },
  { make: 'Hyundai', model: 'Ioniq 5', category: 'EV', price: 42600, quantity: 3 },
  { make: 'Ford', model: 'Mustang Mach-E', category: 'EV', price: 39995, quantity: 2 },
  { make: 'Rivian', model: 'R1S', category: 'EV', price: 75900, quantity: 1 },
  { make: 'Kia', model: 'EV6', category: 'EV', price: 42900, quantity: 0 },
];

/**
 * Idempotent seed: ensures one admin account exists and adds any sample
 * vehicles that are missing. Safe to run on every deploy.
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

  // Match on make + model, including archived rows, so existing stock and prices are
  // never touched and a vehicle an admin deleted (archived) is not brought back.
  const existingVehicles = await prisma.vehicle.findMany({ select: { make: true, model: true } });
  const present = new Set(existingVehicles.map((v) => `${v.make}|${v.model}`));
  const missing = SAMPLE_VEHICLES.filter((v) => !present.has(`${v.make}|${v.model}`));
  if (missing.length) await prisma.vehicle.createMany({ data: missing });
}
