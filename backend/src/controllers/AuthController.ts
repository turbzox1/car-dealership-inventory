import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

/** Thin HTTP layer: body is already validated, business rules live in AuthService. */
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const user = await this.auth.register(req.body);
    res.status(201).json({ user });
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const result = await this.auth.login(req.body);
    res.status(200).json(result);
  };
}
