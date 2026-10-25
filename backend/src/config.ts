/**
 * Environment validation. The process refuses to start (or seed) with
 * missing, weak or copied-from-.env.example secrets, because a guessable
 * JWT_SECRET lets anyone mint admin tokens.
 */

type Env = Record<string, string | undefined>;

export const MIN_JWT_SECRET_LENGTH = 32;
export const MIN_ADMIN_PASSWORD_LENGTH = 12;

const KNOWN_PLACEHOLDERS = new Set([
  'secret', 'password', 'yoursecret', 'mysecret', 'jwtsecret', 'changeit',
  'default', 'example', 'test', 'admin', 'todo', 'xxx',
]);

/** True for values like "change-me", "CHANGE_ME_TOO" or "your-secret" that were never replaced. */
export function isPlaceholderSecret(value: string): boolean {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, '');
  return normalized.includes('changeme') || KNOWN_PLACEHOLDERS.has(normalized);
}

/** Returns the problems with a secret value; empty when it is acceptable. */
export function secretProblems(name: string, value: string | undefined, minLength: number): string[] {
  if (!value) return [`${name} is required`];
  const problems: string[] = [];
  if (value.length < minLength) problems.push(`${name} must be at least ${minLength} characters`);
  if (isPlaceholderSecret(value)) problems.push(`${name} looks like a placeholder value; set a real secret`);
  return problems;
}

function fail(problems: string[]): never {
  throw new Error(`Invalid configuration:\n${problems.map((p) => ` - ${p}`).join('\n')}`);
}

export interface ServerConfig {
  databaseUrl: string;
  jwtSecret: string;
  port: number;
  /** Interface to listen on: localhost in development, all interfaces in production. */
  host: string;
  corsOrigins: string[];
  /** Proxy hops in front of the app; false means X-Forwarded-For is ignored. */
  trustProxy: number | false;
}

export function loadServerConfig(env: Env): ServerConfig {
  const problems: string[] = [];
  if (!env.DATABASE_URL) problems.push('DATABASE_URL is required');
  problems.push(...secretProblems('JWT_SECRET', env.JWT_SECRET, MIN_JWT_SECRET_LENGTH));

  const port = Number(env.PORT ?? 4000);
  if (!Number.isInteger(port) || port <= 0) problems.push('PORT must be a positive whole number');

  const trustProxy = env.TRUST_PROXY ? Number(env.TRUST_PROXY) : false;
  if (trustProxy !== false && (!Number.isInteger(trustProxy) || trustProxy < 0)) {
    problems.push('TRUST_PROXY must be the number of proxy hops (e.g. 1)');
  }

  if (problems.length) fail(problems);

  return {
    databaseUrl: env.DATABASE_URL!,
    jwtSecret: env.JWT_SECRET!,
    port,
    host: env.HOST || (env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'),
    // Comma-separated, e.g. "http://localhost:5173,https://my-app.vercel.app"
    corsOrigins: (env.CORS_ORIGINS ?? 'http://localhost:5173').split(',').map((o) => o.trim()).filter(Boolean),
    trustProxy,
  };
}

export interface SeedConfig {
  databaseUrl: string;
  adminEmail: string;
  adminPassword: string;
}

export function loadSeedConfig(env: Env): SeedConfig {
  const problems: string[] = [];
  if (!env.DATABASE_URL) problems.push('DATABASE_URL is required');
  if (!env.ADMIN_EMAIL) problems.push('ADMIN_EMAIL is required');
  problems.push(...secretProblems('ADMIN_PASSWORD', env.ADMIN_PASSWORD, MIN_ADMIN_PASSWORD_LENGTH));

  if (problems.length) fail(problems);

  return { databaseUrl: env.DATABASE_URL!, adminEmail: env.ADMIN_EMAIL!, adminPassword: env.ADMIN_PASSWORD! };
}
