const INSTALL_MARKER = Symbol.for("freelanceflow.processErrorHandlersInstalled");

export function installProcessErrorHandlers(targetProcess = process, options = {}) {
  if (targetProcess[INSTALL_MARKER]) {
    return false;
  }

  const logger = options.logger ?? console.error;
  const exit = options.exit ?? ((code) => targetProcess.exit(code));

  targetProcess.on("unhandledRejection", (reason) => {
    logger("Unhandled promise rejection:", reason);
    exit(1);
  });

  targetProcess.on("uncaughtException", (error) => {
    logger("Uncaught exception:", error);
    exit(1);
  });

  Object.defineProperty(targetProcess, INSTALL_MARKER, {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false
  });

  return true;
}
