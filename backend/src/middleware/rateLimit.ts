import { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { TooManyRequestsError } from '../domain/errors';

export interface AuthRateLimits {
  /** Failed login attempts allowed per client per window. */
  login: number;
  /** Registrations allowed per client per window. */
  register: number;
  windowMs: number;
}

export const DEFAULT_AUTH_RATE_LIMITS: AuthRateLimits = { login: 10, register: 20, windowMs: 15 * 60 * 1000 };

/**
 * Per-client limits for the auth endpoints, keyed by req.ip (so the app's
 * `trust proxy` setting decides whether X-Forwarded-For is believed).
 * Counters are in memory: correct for one instance, per-instance if scaled out.
 */
export function createAuthRateLimiters({ login, register, windowMs }: AuthRateLimits): {
  login: RequestHandler;
  register: RequestHandler;
} {
  const common = {
    windowMs,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    // Reuse the app's JSON error format instead of the library's plain-text body
    handler: (_req, _res, next) => next(new TooManyRequestsError('Too many attempts, please try again later')),
  } satisfies Parameters<typeof rateLimit>[0];

  return {
    // Only failed logins count, so a user who keeps logging in correctly is never blocked
    login: rateLimit({ ...common, limit: login, skipSuccessfulRequests: true }),
    register: rateLimit({ ...common, limit: register }),
  };
}
