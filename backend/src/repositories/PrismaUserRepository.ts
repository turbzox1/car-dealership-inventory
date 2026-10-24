import { Prisma, PrismaClient } from '@prisma/client';
import { NewUser, UserRecord } from '../domain/User';
import { ConflictError } from '../domain/errors';
import { AuthUser } from '../middleware/authenticate';
import { UserRepository } from './UserRepository';

/** Postgres-backed UserRepository. */
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByEmail(email: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /** Primary-key lookup run on every authenticated request; selects only what auth needs. */
  findAuthUserById(id: string): Promise<AuthUser | null> {
    return this.prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  }

  async create(user: NewUser): Promise<UserRecord> {
    try {
      return await this.prisma.user.create({ data: user });
    } catch (err) {
      // Unique constraint on email: covers two registrations racing past the service check
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictError('Email is already registered');
      }
      throw err;
    }
  }
}
