import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateBody } from '../middleware/validateBody';
import { loginSchema, registerSchema } from '../validation/authSchemas';

export function createAuthRoutes(controller: AuthController): Router {
  const router = Router();
  router.post('/register', validateBody(registerSchema), controller.register);
  router.post('/login', validateBody(loginSchema), controller.login);
  return router;
}
