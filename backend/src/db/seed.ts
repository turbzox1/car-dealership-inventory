import { Prisma, PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { MIN_ADMIN_PASSWORD_LENGTH, secretProblems } from '../config';
import { VehicleImage } from '../domain/Vehicle';
import { registerSchema } from '../validation/authSchemas';
import vehiclePhotos from '../../prisma/vehicle-photos.json';
import { SAMPLE_VEHICLES } from './sampleVehicles';

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

const nameKey = (v: { make: string; model: string }) => `${v.make}|${v.model}`;

/** Credited Wikimedia Commons photos per "make|model", from scripts/fetch-vehicle-photos.mjs. */
const PHOTOS = vehiclePhotos as Record<string, VehicleImage[]>;
const photosFor = (v: { make: string; model: string }) =>
  (PHOTOS[nameKey(v)] ?? []) as unknown as Prisma.InputJsonValue;

/**
 * Idempotent seed: ensures one admin account exists, adds any sample vehicles
 * that are missing, and fills in details and photos for sample vehicles that
 * have none. Safe to run on every deploy.
 */
export async function seedDatabase(prisma: PrismaClient, options: SeedOptions): Promise<void> {
  const { adminEmail, adminPassword } = seedOptionsSchema.parse(options);

  const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (admin) {
    // Promote only; never overwrite a password someone may have changed
    await prisma.user.update({ where: { id: admin.id }, data: { role: 'ADMIN' } });
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({ data: { name: 'Admin', email: adminEmail, passwordHash, role: 'ADMIN' } });
  }

  // Match on make + model, including archived rows, so existing stock and prices are
  // never touched and a vehicle an admin deleted (archived) is not brought back.
  const existing = await prisma.vehicle.findMany({
    select: { id: true, make: true, model: true, description: true, images: true },
  });
  const byName = new Map(existing.map((v) => [nameKey(v), v]));

  const missing = SAMPLE_VEHICLES.filter((v) => !byName.has(nameKey(v)));
  if (missing.length) {
    await prisma.vehicle.createMany({ data: missing.map((v) => ({ ...v, images: photosFor(v) })) });
  }

  // Older databases: give sample vehicles without details their details and photos,
  // but never overwrite a description or photos someone already set.
  for (const sample of SAMPLE_VEHICLES) {
    const row = byName.get(nameKey(sample));
    if (!row) continue;
    const data: Prisma.VehicleUpdateInput = {};
    if (row.description === null) {
      const { year, fuelType, transmission, seats, description } = sample;
      Object.assign(data, { year, fuelType, transmission, seats, description });
    }
    if ((row.images as unknown[]).length === 0) data.images = photosFor(sample);
    if (Object.keys(data).length) await prisma.vehicle.update({ where: { id: row.id }, data });
  }
}
