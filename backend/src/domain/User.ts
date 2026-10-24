export type Role = 'USER' | 'ADMIN';

/** A user as stored in the database, including the password hash. */
export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
}

/** A user as safely exposed outside the service layer (no credentials). */
export type PublicUser = Omit<UserRecord, 'passwordHash'>;

export interface NewUser {
  name: string;
  email: string;
  passwordHash: string;
  role?: Role;
}

/** Identity of an authenticated caller; the role always comes from the database. */
export interface AuthUser {
  id: string;
  role: Role;
}

/** Reads the caller's current account state; null when the user no longer exists. */
export interface UserLookup {
  findAuthUserById(id: string): Promise<AuthUser | null>;
}
