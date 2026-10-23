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

/**
 * Authentication only: answers "who is calling?".
 * Verifies the Bearer JWT and sets `req.user`; any missing or invalid
 * token becomes a 401. It does not check roles — see `requireAdmin`.
 */
export function createAuthenticate(jwtSecret: string): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      return next(new UnauthorizedError('Missing or malformed Authorization header'));
    }

    try {
      const payload = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
      if (!payload.sub || (payload.role !== 'USER' && payload.role !== 'ADMIN')) {
        return next(new UnauthorizedError('Invalid token'));
      }
      req.user = { id: payload.sub, role: payload.role };
      next();
    } catch {
      // Covers bad signature, malformed token and expiry alike
      next(new UnauthorizedError('Invalid or expired token'));
    }
  };
}
