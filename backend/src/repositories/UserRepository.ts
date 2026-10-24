import { NewUser, UserLookup, UserRecord } from '../domain/User';

/** Persistence port for users; services depend on this, not on Prisma. */
export interface UserRepository extends UserLookup {
  findByEmail(email: string): Promise<UserRecord | null>;
  create(user: NewUser): Promise<UserRecord>;
}
