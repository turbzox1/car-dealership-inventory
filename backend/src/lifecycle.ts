import { Server } from 'http';

export interface ShutdownOptions {
  server: Server;
  /** Closes the database connection pool. */
  disconnect: () => Promise<void>;
  /** How long to wait for in-flight requests before cutting connections. */
  timeoutMs: number;
  logger?: Pick<Console, 'log' | 'error'>;
}

/**
 * Builds an idempotent shutdown handler for SIGTERM/SIGINT: stop accepting
 * connections, let in-flight requests (e.g. a purchase transaction) finish,
 * then release the database pool. Hosts like Render send SIGTERM on redeploy.
 */
export function createGracefulShutdown({ server, disconnect, timeoutMs, logger = console }: ShutdownOptions) {
  let shuttingDown: Promise<void> | undefined;

  return function shutdown(signal: string): Promise<void> {
    shuttingDown ??= (async () => {
      logger.log(`${signal} received, shutting down`);

      const closed = new Promise<void>((resolve) => server.close(() => resolve()));
      // Keep-alive sockets with no active request would otherwise hold close() open
      server.closeIdleConnections();

      let timer: NodeJS.Timeout | undefined;
      const timedOut = new Promise<'timeout'>((resolve) => {
        timer = setTimeout(() => resolve('timeout'), timeoutMs);
      });

      if ((await Promise.race([closed, timedOut])) === 'timeout') {
        logger.error(`Requests still running after ${timeoutMs}ms; closing connections`);
        server.closeAllConnections();
        await closed;
      }
      clearTimeout(timer);

      await disconnect();
      logger.log('Shutdown complete');
    })();
    return shuttingDown;
  };
}
