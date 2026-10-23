import { NextFunction, Request, Response } from 'express';
import { AppError } from '../domain/errors';

/** Turns thrown errors into `{ error }` JSON responses; unknown errors become 500. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
