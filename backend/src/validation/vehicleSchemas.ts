import { z } from 'zod';
import { CATEGORIES } from '../domain/Vehicle';

const text = z.string().trim().min(1, 'Required').max(100);
/** Accepts any letter case ("suv" → "SUV"). */
const category = z.string().trim().toUpperCase().pipe(z.enum(CATEGORIES));
const price = z.number().positive('Price must be greater than 0').max(100_000_000);

export const createVehicleSchema = z.object({
  make: text,
  model: text,
  category,
  price,
  quantity: z.number().int('Quantity must be a whole number').min(0, 'Quantity cannot be negative'),
});

/** Strict: unknown keys (including quantity) are rejected; stock changes go through purchase/restock. */
export const updateVehicleSchema = z
  .strictObject({ make: text, model: text, category, price })
  .partial()
  .refine((changes) => Object.keys(changes).length > 0, 'Provide at least one field to update');

/** Query strings arrive as text, so prices are coerced to numbers. */
export const searchVehicleSchema = z.object({
  make: text.optional(),
  model: text.optional(),
  category: category.optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
});
