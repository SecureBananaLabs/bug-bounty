import { fork } from "node:child_process";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

export function startFixture({ host = "127.0.0.1", port = 0 } = {}) {
  return new Promise((resolve, reject) => {
    // Deliberately do not pass inherited DB/payment credentials or NODE_OPTIONS.
    const child = fork(fileURLToPath(new URL("./fixture.mjs", import.meta.url)), [], {
      env: { NODE_ENV: "test", JWT_SECRET: randomBytes(32).toString("hex"),
        BENCH_HOST: host, BENCH_PORT: String(port), BENCH_LIMIT: "100000" },
      stdio: ["ignore", "ignore", "ignore", "ipc"], execArgv: []
    });
    let ready = false;
    let stopped;
    const stop = () => stopped ??= new Promise((done) => {
      if (child.exitCode !== null || child.signalCode !== null) return done();
      const killTimer = setTimeout(() => child.kill("SIGKILL"), 3000);
      child.once("exit", () => { clearTimeout(killTimer); done(); });
      child.kill("SIGTERM");
    });
    const timer = setTimeout(() => { void stop(); reject(new Error("Fixture startup timed out")); }, 10000);
    child.once("error", (error) => { clearTimeout(timer); reject(error); });
    child.once("exit", (code, signal) => {
      clearTimeout(timer);
      if (!ready) reject(new Error(`Fixture exited before readiness (${code ?? signal})`));
    });
    child.on("message", (message) => {
      if (ready) return;
      if (message.type === "error") {
        clearTimeout(timer); void stop(); reject(new Error("Fixture setup failed"));
      } else if (message.type === "ready") {
        ready = true; clearTimeout(timer);
        resolve({ ...message, stop, pid: child.pid });
      }
    });
  });
}
