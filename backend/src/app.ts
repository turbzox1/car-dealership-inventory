import cors from 'cors';
import express, { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthController } from './controllers/AuthController';
import { InventoryController } from './controllers/InventoryController';
import { VehicleController } from './controllers/VehicleController';
import { NotFoundError } from './domain/errors';
import { createAuthenticate } from './middleware/authenticate';
import { errorHandler } from './middleware/errorHandler';
import { AuthRateLimits, createAuthRateLimiters, DEFAULT_AUTH_RATE_LIMITS } from './middleware/rateLimit';
import { PrismaInventoryRepository } from './repositories/PrismaInventoryRepository';
import { PrismaUserRepository } from './repositories/PrismaUserRepository';
import { PrismaVehicleRepository } from './repositories/PrismaVehicleRepository';
import { createAuthRoutes } from './routes/authRoutes';
import { createInventoryRoutes } from './routes/inventoryRoutes';
import { createVehicleRoutes } from './routes/vehicleRoutes';
import { AuthService } from './services/AuthService';
import { InventoryService } from './services/InventoryService';
import { VehicleService } from './services/VehicleService';

export interface AppDependencies {
  prisma: PrismaClient;
  jwtSecret: string;
  /** Frontend origins allowed to call the API from a browser. */
  corsOrigins?: string[];
  /** Per-client limits on login failures and registrations. */
  rateLimits?: AuthRateLimits;
  /** Proxy hops to trust for the client IP (e.g. 1 on Render); false to ignore X-Forwarded-For. */
  trustProxy?: number | false;
}

/** Composition root: wires repositories → services → controllers → routes. */
export function createApp({
  prisma,
  jwtSecret,
  corsOrigins = [],
  rateLimits = DEFAULT_AUTH_RATE_LIMITS,
  trustProxy = false,
}: AppDependencies): Express {
  const app = express();
  app.set('trust proxy', trustProxy);
  app.disable('x-powered-by');
  app.use(cors({ origin: corsOrigins }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const users = new PrismaUserRepository(prisma);
  const authenticate = createAuthenticate(jwtSecret, users);

  const authService = new AuthService(users, jwtSecret);
  app.use('/api/auth', createAuthRoutes(new AuthController(authService), createAuthRateLimiters(rateLimits)));

  const vehicleService = new VehicleService(new PrismaVehicleRepository(prisma));
  app.use('/api/vehicles', createVehicleRoutes(new VehicleController(vehicleService), authenticate));

  const inventoryService = new InventoryService(new PrismaInventoryRepository(prisma));
  app.use('/api', createInventoryRoutes(new InventoryController(inventoryService), authenticate));

  app.use((_req, _res, next) => next(new NotFoundError('Route not found')));
  app.use(errorHandler);
  return app;
}
