import { z } from 'zod';

const positiveWhole = (name: string) =>
  z.number().int(`${name} must be a whole number`).positive(`${name} must be greater than 0`).max(1000);

/** Body is optional: no body means buying a single unit. */
export const purchaseSchema = z.object({ quantity: positiveWhole('Quantity').default(1) });

export const restockSchema = z.object({ amount: positiveWhole('Amount') });

/** Cart checkout: 1-20 lines (the service also merges repeats and re-checks the limit). */
export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        vehicleId: z.string().trim().min(1, 'Vehicle is required'),
        quantity: positiveWhole('Quantity').default(1),
      }),
    )
    .min(1, 'Your cart is empty')
    .max(20, 'A cart can hold up to 20 different vehicles'),
});
