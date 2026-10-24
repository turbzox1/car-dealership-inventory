import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

/** Absolute URL for an API path, matching what the API client requests in tests. */
export const apiUrl = (path: string) => new URL(path, window.location.origin).toString();

/**
 * Mock API for component tests. The default handlers let any test reach the
 * dashboard; tests override them or add more with server.use().
 */
export const server = setupServer(
  http.get(apiUrl('/api/vehicles'), () => HttpResponse.json([])),
  // By default the account is unchanged since login: echo the user the test stored
  http.get(apiUrl('/api/auth/me'), () => {
    const stored = JSON.parse(localStorage.getItem('autovault.session') ?? 'null');
    return stored ? HttpResponse.json({ user: stored.user }) : HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }),
);
