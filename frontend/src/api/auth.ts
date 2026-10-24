import type { Session, User } from '../types';
import { apiRequest } from './client';

export function login(email: string, password: string): Promise<Session> {
  return apiRequest<Session>('/api/auth/login', { method: 'POST', body: { email, password } });
}

export async function register(name: string, email: string, password: string): Promise<User> {
  const { user } = await apiRequest<{ user: User }>('/api/auth/register', {
    method: 'POST',
    body: { name, email, password },
  });
  return user;
}
