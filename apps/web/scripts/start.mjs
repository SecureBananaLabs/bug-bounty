import { spawn } from "node:child_process";
import { resolvePort } from "./port.mjs";

const child = spawn("next", ["start", "-p", resolvePort()], {
  stdio: "inherit",
  shell: process.platform === "win32"
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
