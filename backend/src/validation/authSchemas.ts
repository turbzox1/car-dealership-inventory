import { z } from 'zod';

/** Emails are trimmed and lower-cased so "Asha@X.com" and "asha@x.com" are the same account. */
const email = z.string().trim().toLowerCase().pipe(z.email('Invalid email address'));

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email,
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});
