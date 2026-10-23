import { z } from 'zod';

const positiveWhole = (name: string) =>
  z.number().int(`${name} must be a whole number`).positive(`${name} must be greater than 0`).max(1000);

/** Body is optional: no body means buying a single unit. */
export const purchaseSchema = z.object({ quantity: positiveWhole('Quantity').default(1) });

export const restockSchema = z.object({ amount: positiveWhole('Amount') });
