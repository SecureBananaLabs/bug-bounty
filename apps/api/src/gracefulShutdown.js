export function createGracefulShutdown({
  server,
  timeoutMs = 10000,
  exit = process.exit,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  logger = console
}) {
  let shuttingDown = false;

  return function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.log(`Received ${signal}; shutting down HTTP server`);

    const timeout = setTimer(() => {
      logger.error(`Graceful shutdown timed out after ${timeoutMs}ms`);
      exit(1);
    }, timeoutMs);
    timeout?.unref?.();

    server.close((error) => {
      clearTimer(timeout);

      if (error) {
        logger.error("Failed to close HTTP server", error);
        exit(1);
        return;
      }

      logger.log("HTTP server closed");
      exit(0);
    });
  };
}