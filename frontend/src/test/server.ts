import { setupServer } from 'msw/node';

/** Mock API for component tests; each test registers the handlers it needs with server.use(). */
export const server = setupServer();

/** Absolute URL for an API path, matching what the API client requests in tests. */
export const apiUrl = (path: string) => new URL(path, window.location.origin).toString();
