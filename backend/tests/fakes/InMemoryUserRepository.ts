import { randomUUID } from 'crypto';
import { AuthUser, NewUser, UserRecord } from '../../src/domain/User';
import { UserRepository } from '../../src/repositories/UserRepository';

/** Test double for unit tests only; the app itself always uses Postgres. */
export class InMemoryUserRepository implements UserRepository {
  private users: UserRecord[] = [];

  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.users.find((u) => u.email === email) ?? null;
  }

  async findAuthUserById(id: string): Promise<AuthUser | null> {
    const user = this.users.find((u) => u.id === id);
    return user ? { id: user.id, role: user.role } : null;
  }

  async create(user: NewUser): Promise<UserRecord> {
    const record: UserRecord = { id: randomUUID(), role: 'USER', createdAt: new Date(), ...user };
    this.users.push(record);
    return record;
  }
}
