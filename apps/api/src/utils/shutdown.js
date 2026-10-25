/**
 * Graceful HTTP server shutdown.
 *
 * Stops accepting new connections, lets in-flight requests finish, and
 * enforces a bounded timeout so shutdown can never hang forever.
 */

export const DEFAULT_SHUTDOWN_TIMEOUT_MS = 10_000;

/**
 * @param {import("node:http").Server} server
 * @param {object} [options]
 * @param {number} [options.timeoutMs] max time to wait before forcing exit
 * @param {(err?: Error) => void} [options.onClose] called once the server closes
 * @param {(reason: string) => void} [options.onForceClose] called if the timeout elapses
 * @returns {() => void} idempotent shutdown trigger
 */
export function createShutdownHandler(server, options = {}) {
  const {
    timeoutMs = DEFAULT_SHUTDOWN_TIMEOUT_MS,
    onClose = () => {},
    onForceClose = () => {}
  } = options;

  let shuttingDown = false;

  return function shutdown() {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;

    const timer = setTimeout(() => {
      onForceClose(`Shutdown timed out after ${timeoutMs}ms`);
    }, timeoutMs);
    if (typeof timer.unref === "function") {
      timer.unref();
    }

    server.close((error) => {
      clearTimeout(timer);
      onClose(error);
    });
  };
}
