import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PublicUser, UserRecord } from '../domain/User';
import { ConflictError, NotFoundError, UnauthorizedError } from '../domain/errors';
import { UserRepository } from '../repositories/UserRepository';

const SALT_ROUNDS = 10;
const TOKEN_TTL = '1h';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: PublicUser;
}

/** Handles user registration, login and JWT issuing. */
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

  async login(input: LoginInput): Promise<LoginResult> {
    const user = await this.users.findByEmail(input.email);
    // Same error for unknown email and wrong password, so we don't leak which emails exist
    const passwordMatches = user ? await bcrypt.compare(input.password, user.passwordHash) : false;
    if (!user || !passwordMatches) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = jwt.sign({ role: user.role }, this.jwtSecret, {
      subject: user.id,
      expiresIn: TOKEN_TTL,
    });
    return { token, user: toPublicUser(user) };
  }

  /** Current account state, so clients can refresh a stale copy (e.g. after a role change). */
  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('Account not found');
    return toPublicUser(user);
  }
}

function toPublicUser({ passwordHash: _omit, ...user }: UserRecord): PublicUser {
  return user;
}
