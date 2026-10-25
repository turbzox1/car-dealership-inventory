import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './server';

// findBy*/waitFor wait up to 4s instead of 1s: debounced searches and full-app renders
// can take over a second when the machine is busy. Assertions are unchanged.
configure({ asyncUtilTimeout: 4000 });

// Any request without a matching handler fails the test, so no call escapes to a real network
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

afterEach(() => {
  server.resetHandlers();
  cleanup();
  localStorage.clear();
});

afterAll(() => server.close());
