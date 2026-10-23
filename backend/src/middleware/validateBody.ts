import { NextFunction, Request, Response } from 'express';
import { ZodType } from 'zod';
import { ValidationError } from '../domain/errors';

/** Validates and normalizes req.body against a zod schema; invalid input becomes a 400. */
export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const issue = result.error.issues[0];
      const field = issue.path.join('.');
      return next(new ValidationError(field ? `${field}: ${issue.message}` : issue.message));
    }
    req.body = result.data;
    next();
  };
}
