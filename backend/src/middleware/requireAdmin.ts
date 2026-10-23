import { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../domain/errors';

/**
 * Authorization only: answers "is this caller allowed?".
 * Must run after `authenticate`. No user → 401 (fails safe if mis-wired);
 * a logged-in non-admin → 403.
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new UnauthorizedError());
  }
  if (req.user.role !== 'ADMIN') {
    return next(new ForbiddenError('Admin access required'));
  }
  next();
}
