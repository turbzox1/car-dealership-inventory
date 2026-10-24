import { useCallback } from 'react';
import { useAuth } from '../auth/useAuth';
import { ApiError, apiRequest, type RequestOptions } from './client';

export type ApiCall = <T>(path: string, options?: Omit<RequestOptions, 'token'>) => Promise<T>;

/**
 * apiRequest bound to the signed-in user's token. A 401 means the session
 * is no longer valid (expired token, deleted account), so the user is signed
 * out and the route guard takes them to the login page.
 */
export function useApi(): ApiCall {
  const { token, logout } = useAuth();
  return useCallback<ApiCall>(
    async (path, options) => {
      try {
        return await apiRequest(path, { ...options, token });
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) logout();
        throw err;
      }
    },
    [token, logout],
  );
}
