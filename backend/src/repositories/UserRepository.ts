import { NewUser, UserRecord } from '../domain/User';
import { UserLookup } from '../middleware/authenticate';

/** Persistence port for users; services depend on this, not on Prisma. */
export interface UserRepository extends UserLookup {
  findByEmail(email: string): Promise<UserRecord | null>;
  create(user: NewUser): Promise<UserRecord>;
}
