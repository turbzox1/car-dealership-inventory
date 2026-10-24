import { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../domain/User';
import { UnauthorizedError } from '../domain/errors';

/** Identity of the caller, set by `authenticate` for downstream handlers. */
export interface AuthUser {
  id: string;
  role: Role;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

/** Reads the caller's current account state; null when the user no longer exists. */
export interface UserLookup {
  findAuthUserById(id: string): Promise<AuthUser | null>;
}

/**
 * Authentication only: answers "who is calling?".
 * Verifies the Bearer JWT, then loads the user so a deleted account is
 * rejected and role changes apply immediately rather than when the token
 * expires. Any failure becomes a 401. Role checks live in `requireAdmin`.
 */
export function createAuthenticate(jwtSecret: string, users: UserLookup): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      return next(new UnauthorizedError('Missing or malformed Authorization header'));
    }

    let userId: string | undefined;
    try {
      userId = (jwt.verify(token, jwtSecret) as jwt.JwtPayload).sub;
    } catch {
      // Covers bad signature, malformed token and expiry alike
      return next(new UnauthorizedError('Invalid or expired token'));
    }
    if (!userId) return next(new UnauthorizedError('Invalid token'));

    try {
      const user = await users.findAuthUserById(userId);
      if (!user) return next(new UnauthorizedError('Account no longer exists'));
      // The role comes from the database, never from the token's claim
      req.user = user;
      next();
    } catch (err) {
      next(err);
    }
  };
}
