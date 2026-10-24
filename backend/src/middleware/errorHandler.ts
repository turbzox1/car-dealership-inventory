import { NextFunction, Request, Response } from 'express';
import { AppError } from '../domain/errors';

/** express.json() raises this when the request body isn't valid JSON. */
function isMalformedJson(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { type?: string }).type === 'entity.parse.failed';
}

/** Turns thrown errors into `{ error }` JSON responses; unknown errors become 500. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (isMalformedJson(err)) {
    res.status(400).json({ error: 'Request body is not valid JSON' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
