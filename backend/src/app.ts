import express, { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthController } from './controllers/AuthController';
import { errorHandler } from './middleware/errorHandler';
import { PrismaUserRepository } from './repositories/PrismaUserRepository';
import { createAuthRoutes } from './routes/authRoutes';
import { AuthService } from './services/AuthService';

export interface AppDependencies {
  prisma: PrismaClient;
  jwtSecret: string;
}

/** Composition root: wires repositories → services → controllers → routes. */
export function createApp({ prisma, jwtSecret }: AppDependencies): Express {
  const app = express();
  app.use(express.json());

  const authService = new AuthService(new PrismaUserRepository(prisma), jwtSecret);
  app.use('/api/auth', createAuthRoutes(new AuthController(authService)));

  app.use(errorHandler);
  return app;
}
