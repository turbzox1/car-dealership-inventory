import express from 'express';
import { AddressInfo } from 'net';
import { Server } from 'http';
import { createGracefulShutdown } from '../../src/lifecycle';

/** Real HTTP server with one slow route, to observe what happens to in-flight requests. */
function startSlowServer(delayMs: number): Promise<{ server: Server; url: string }> {
  const app = express();
  app.get('/slow', (_req, res) => {
    setTimeout(() => res.json({ done: true }), delayMs);
  });
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const { port } = server.address() as AddressInfo;
      resolve({ server, url: `http://127.0.0.1:${port}` });
    });
  });
}

const silent = { log: () => {}, error: () => {} };

describe('createGracefulShutdown', () => {
  it('lets an in-flight request finish, then disconnects the database', async () => {
    const { server, url } = await startSlowServer(200);
    const events: string[] = [];
    const shutdown = createGracefulShutdown({
      server,
      disconnect: async () => { events.push('db disconnected'); },
      timeoutMs: 5000,
      logger: silent,
    });

    const inFlight = fetch(`${url}/slow`).then(async (r) => {
      events.push(`request finished ${r.status}`);
      return r.json();
    });
    await new Promise((r) => setTimeout(r, 50)); // request is now being handled

    await shutdown('SIGTERM');

    expect(await inFlight).toEqual({ done: true });
    expect(events).toEqual(['request finished 200', 'db disconnected']);
  });

  it('stops accepting new connections', async () => {
    const { server, url } = await startSlowServer(0);
    const shutdown = createGracefulShutdown({ server, disconnect: async () => {}, timeoutMs: 5000, logger: silent });

    await shutdown('SIGTERM');

    await expect(fetch(`${url}/slow`)).rejects.toThrow();
  });

  it('gives up waiting after the timeout so a stuck request cannot block shutdown', async () => {
    const { server, url } = await startSlowServer(60_000);
    const disconnect = jest.fn(async () => {});
    const shutdown = createGracefulShutdown({ server, disconnect, timeoutMs: 200, logger: silent });

    const stuck = fetch(`${url}/slow`).catch(() => 'connection closed');
    await new Promise((r) => setTimeout(r, 50));

    const started = Date.now();
    await shutdown('SIGTERM');

    expect(Date.now() - started).toBeLessThan(2000);
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(await stuck).toBe('connection closed');
  });

  it('runs only once even if several signals arrive', async () => {
    const { server } = await startSlowServer(0);
    const disconnect = jest.fn(async () => {});
    const shutdown = createGracefulShutdown({ server, disconnect, timeoutMs: 5000, logger: silent });

    await Promise.all([shutdown('SIGTERM'), shutdown('SIGINT')]);

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
