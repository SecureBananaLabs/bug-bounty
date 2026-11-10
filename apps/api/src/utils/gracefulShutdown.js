export function installGracefulShutdown(server, { timeoutMs = 10_000 } = {}) {
  let shuttingDown = false;

  server.on("request", (_request, response) => {
    response.once("finish", () => {
      if (shuttingDown) server.closeIdleConnections?.();
    });
  });

  function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;

    const deadline = setTimeout(() => {
      console.error(`Graceful shutdown timed out after ${timeoutMs} ms.`);
      server.closeAllConnections?.();
      process.exit(1);
    }, timeoutMs);

    server.close((error) => {
      clearTimeout(deadline);
      if (error) {
        console.error("HTTP server shutdown failed:", error);
        process.exit(1);
      } else {
        process.exit(0);
      }
    });
    server.closeIdleConnections?.();
    console.log(`Received ${signal}; closing HTTP server.`);
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
