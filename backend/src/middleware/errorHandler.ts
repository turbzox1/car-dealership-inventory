import { NextFunction, Request, Response } from 'express';
import { AppError } from '../domain/errors';

/** body-parser errors (from express.json()) carry a `type` saying what went wrong. */
function bodyErrorType(err: unknown): string | undefined {
  return typeof err === 'object' && err !== null ? (err as { type?: string }).type : undefined;
}

/** Turns thrown errors into `{ error }` JSON responses; unknown errors become 500. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  switch (bodyErrorType(err)) {
    case 'entity.parse.failed':
      res.status(400).json({ error: 'Request body is not valid JSON' });
      return;
    case 'entity.too.large':
      res.status(413).json({ error: 'Request body is too large' });
      return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
