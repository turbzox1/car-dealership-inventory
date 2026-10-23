import { NextFunction, Request, Response } from 'express';
import { ZodType } from 'zod';
import { ValidationError } from '../domain/errors';

/**
 * Validates req.query against a zod schema; invalid input becomes a 400.
 * Express 5 makes req.query read-only, so the parsed result goes to res.locals.query.
 */
export function validateQuery(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const issue = result.error.issues[0];
      const field = issue.path.join('.');
      return next(new ValidationError(field ? `${field}: ${issue.message}` : issue.message));
    }
    res.locals.query = result.data;
    next();
  };
}
