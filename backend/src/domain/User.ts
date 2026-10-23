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
