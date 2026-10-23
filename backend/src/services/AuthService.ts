import bcrypt from 'bcryptjs';
import { PublicUser, UserRecord } from '../domain/User';
import { ConflictError } from '../domain/errors';
import { UserRepository } from '../repositories/UserRepository';

const SALT_ROUNDS = 10;

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

/** Handles user registration and (later) login and token issuing. */
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly jwtSecret: string,
  ) {}

  async register(input: RegisterInput): Promise<PublicUser> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await this.users.create({ name: input.name, email: input.email, passwordHash });
    return toPublicUser(user);
  }
}

function toPublicUser({ passwordHash: _omit, ...user }: UserRecord): PublicUser {
  return user;
}
