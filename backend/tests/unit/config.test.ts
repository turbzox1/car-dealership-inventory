import { isPlaceholderSecret, loadServerConfig, loadSeedConfig } from '../../src/config';

const STRONG_SECRET = 'k3J9xQ2mZ8vT4wR7yB1nL6pH0sD5fG2a'; // 32 chars, random-looking

const validServerEnv = {
  DATABASE_URL: 'postgresql://u:p@localhost:5433/db',
  JWT_SECRET: STRONG_SECRET,
};

describe('isPlaceholderSecret', () => {
  it.each(['change-me', 'CHANGE_ME', 'changeme', 'change-me-too', 'please-change-me-now', 'secret', 'password', 'your-secret'])(
    'flags %p',
    (value) => expect(isPlaceholderSecret(value)).toBe(true),
  );

  it.each([STRONG_SECRET, 'Correct-Horse-Battery-Staple-42'])('accepts %p', (value) => {
    expect(isPlaceholderSecret(value)).toBe(false);
  });
});

describe('loadServerConfig', () => {
  it('returns typed config with defaults for optional values', () => {
    expect(loadServerConfig(validServerEnv)).toEqual({
      databaseUrl: validServerEnv.DATABASE_URL,
      jwtSecret: STRONG_SECRET,
      port: 4000,
      host: '127.0.0.1',
      corsOrigins: ['http://localhost:5173'],
      trustProxy: false,
    });
  });

  it('does not trust proxy headers unless TRUST_PROXY is set', () => {
    expect(loadServerConfig(validServerEnv).trustProxy).toBe(false);
    expect(loadServerConfig({ ...validServerEnv, TRUST_PROXY: '1' }).trustProxy).toBe(1);
  });

  it('listens on localhost only outside production', () => {
    expect(loadServerConfig(validServerEnv).host).toBe('127.0.0.1');
    expect(loadServerConfig({ ...validServerEnv, NODE_ENV: 'development' }).host).toBe('127.0.0.1');
  });

  it('listens on all interfaces in production, so a hosting platform can route to it', () => {
    expect(loadServerConfig({ ...validServerEnv, NODE_ENV: 'production' }).host).toBe('0.0.0.0');
  });

  it('lets HOST override the default', () => {
    expect(loadServerConfig({ ...validServerEnv, HOST: '0.0.0.0' }).host).toBe('0.0.0.0');
    expect(loadServerConfig({ ...validServerEnv, NODE_ENV: 'production', HOST: '::' }).host).toBe('::');
  });

  it('throws for a TRUST_PROXY that is not a hop count', () => {
    expect(() => loadServerConfig({ ...validServerEnv, TRUST_PROXY: 'yes' })).toThrow(/TRUST_PROXY/);
  });

  it('parses PORT and a comma-separated CORS_ORIGINS list', () => {
    const config = loadServerConfig({ ...validServerEnv, PORT: '8080', CORS_ORIGINS: 'http://a.com, https://b.com' });

    expect(config.port).toBe(8080);
    expect(config.corsOrigins).toEqual(['http://a.com', 'https://b.com']);
  });

  it.each([
    ['missing JWT_SECRET', { DATABASE_URL: validServerEnv.DATABASE_URL }, /JWT_SECRET/],
    ['empty JWT_SECRET', { ...validServerEnv, JWT_SECRET: '' }, /JWT_SECRET/],
    ['short JWT_SECRET', { ...validServerEnv, JWT_SECRET: 'Xy7#short' }, /JWT_SECRET.*32/],
    ['placeholder JWT_SECRET', { ...validServerEnv, JWT_SECRET: 'change-me' }, /JWT_SECRET.*placeholder/],
    ['long placeholder JWT_SECRET', { ...validServerEnv, JWT_SECRET: 'change-me-change-me-change-me-change-me' }, /placeholder/],
    ['missing DATABASE_URL', { JWT_SECRET: STRONG_SECRET }, /DATABASE_URL/],
    ['non-numeric PORT', { ...validServerEnv, PORT: 'eighty' }, /PORT/],
  ])('throws for %s', (_case, env, message) => {
    expect(() => loadServerConfig(env)).toThrow(message);
  });

  it('reports every problem at once', () => {
    expect(() => loadServerConfig({ JWT_SECRET: 'change-me' })).toThrow(/DATABASE_URL[\s\S]*JWT_SECRET|JWT_SECRET[\s\S]*DATABASE_URL/);
  });
});

describe('loadSeedConfig', () => {
  const validSeedEnv = {
    DATABASE_URL: validServerEnv.DATABASE_URL,
    ADMIN_EMAIL: 'admin@dealership.com',
    ADMIN_PASSWORD: 'Correct-Horse-Battery-Staple-42',
  };

  it('returns the admin credentials', () => {
    expect(loadSeedConfig(validSeedEnv)).toEqual({
      databaseUrl: validSeedEnv.DATABASE_URL,
      adminEmail: 'admin@dealership.com',
      adminPassword: 'Correct-Horse-Battery-Staple-42',
    });
  });

  it.each([
    ['missing ADMIN_PASSWORD', { ...validSeedEnv, ADMIN_PASSWORD: undefined }, /ADMIN_PASSWORD/],
    ['short ADMIN_PASSWORD', { ...validSeedEnv, ADMIN_PASSWORD: 'Short-pass1' }, /ADMIN_PASSWORD.*12/],
    ['placeholder ADMIN_PASSWORD', { ...validSeedEnv, ADMIN_PASSWORD: 'change-me-too' }, /ADMIN_PASSWORD.*placeholder/],
    ['missing ADMIN_EMAIL', { ...validSeedEnv, ADMIN_EMAIL: undefined }, /ADMIN_EMAIL/],
  ])('throws for %s', (_case, env, message) => {
    expect(() => loadSeedConfig(env)).toThrow(message);
  });
});
