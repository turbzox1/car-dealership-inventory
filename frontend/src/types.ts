export type Role = 'USER' | 'ADMIN';

/** User as returned by the API (never includes credentials). */
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Session {
  token: string;
  user: User;
}
