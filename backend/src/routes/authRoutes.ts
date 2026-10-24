import { RequestHandler, Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateBody } from '../middleware/validate';
import { loginSchema, registerSchema } from '../validation/authSchemas';

export interface AuthRouteLimiters {
  login: RequestHandler;
  register: RequestHandler;
}

/** Rate limiters run first, so blocked clients never reach validation or the database. */
export function createAuthRoutes(controller: AuthController, limiters: AuthRouteLimiters): Router {
  const router = Router();
  router.post('/register', limiters.register, validateBody(registerSchema), controller.register);
  router.post('/login', limiters.login, validateBody(loginSchema), controller.login);
  return router;
}
