import express, { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthController } from './controllers/AuthController';
import { VehicleController } from './controllers/VehicleController';
import { createAuthenticate } from './middleware/authenticate';
import { errorHandler } from './middleware/errorHandler';
import { PrismaUserRepository } from './repositories/PrismaUserRepository';
import { PrismaVehicleRepository } from './repositories/PrismaVehicleRepository';
import { createAuthRoutes } from './routes/authRoutes';
import { createVehicleRoutes } from './routes/vehicleRoutes';
import { AuthService } from './services/AuthService';
import { VehicleService } from './services/VehicleService';

export interface AppDependencies {
  prisma: PrismaClient;
  jwtSecret: string;
}

/** Composition root: wires repositories → services → controllers → routes. */
export function createApp({ prisma, jwtSecret }: AppDependencies): Express {
  const app = express();
  app.use(express.json());

  const authenticate = createAuthenticate(jwtSecret);

  const authService = new AuthService(new PrismaUserRepository(prisma), jwtSecret);
  app.use('/api/auth', createAuthRoutes(new AuthController(authService)));

  const vehicleService = new VehicleService(new PrismaVehicleRepository(prisma));
  app.use('/api/vehicles', createVehicleRoutes(new VehicleController(vehicleService), authenticate));

  app.use(errorHandler);
  return app;
}
