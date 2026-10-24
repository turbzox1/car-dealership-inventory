import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

/** Absolute URL for an API path, matching what the API client requests in tests. */
export const apiUrl = (path: string) => new URL(path, window.location.origin).toString();

/**
 * Mock API for component tests. The default handlers let any test reach the
 * dashboard; tests override them or add more with server.use().
 */
export const server = setupServer(http.get(apiUrl('/api/vehicles'), () => HttpResponse.json([])));
