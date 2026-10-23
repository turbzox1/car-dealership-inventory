import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodType } from 'zod';
import { ValidationError } from '../domain/errors';

/** Reports the first problem as "field: message" so clients know what to fix. */
function toValidationError(error: ZodError): ValidationError {
  const issue = error.issues[0];
  const field = issue.path.join('.');
  return new ValidationError(field ? `${field}: ${issue.message}` : issue.message);
}

/** Validates and normalizes req.body; invalid input becomes a 400. */
export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) return next(toValidationError(result.error));
    req.body = result.data;
    next();
  };
}

/**
 * Validates req.query; invalid input becomes a 400.
 * Express 5 makes req.query read-only, so the parsed result goes to res.locals.query.
 */
export function validateQuery(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) return next(toValidationError(result.error));
    res.locals.query = result.data;
    next();
  };
}
