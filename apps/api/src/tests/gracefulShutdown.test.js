import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { get, Agent } from "node:http";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const helperUrl = new URL("../utils/gracefulShutdown.js", import.meta.url).href;
const serverFile = fileURLToPath(new URL("../server.js", import.meta.url));

function childProcess(t, args, env = {}) {
  const child = spawn(process.execPath, args, {
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe", "ipc"]
  });
  let output = "";
  let ended = false;
  const messages = [];
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  child.on("message", (message) => messages.push(message));
  const exit = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      ended = true;
      resolve({ code, signal });
    });
  });
  t.after(async () => {
    if (!ended) {
      child.kill("SIGKILL");
      await exit;
    }
  });

  async function waitFor(check, event, emitter) {
    const existing = check();
    if (existing) return existing;
    return new Promise((resolve, reject) => {
      const deadline = setTimeout(() => finish(new Error(`Child did not become ready: ${output}`)), 5_000);
      const onExit = () => finish(new Error(`Child exited before readiness: ${output}`));
      const onEvent = () => {
        const found = check();
        if (found) finish(null, found);
      };
      function finish(error, value) {
        clearTimeout(deadline);
        emitter.off(event, onEvent);
        child.off("exit", onExit);
        if (error) reject(error);
        else resolve(value);
      }
      emitter.on(event, onEvent);
      child.once("exit", onExit);
    });
  }

  return {
    child,
    exit,
    get ended() { return ended; },
    get output() { return output; },
    message: (type) => waitFor(() => messages.find((m) => m.type === type), "message", child),
    logged: (pattern) => waitFor(() => output.match(pattern), "data", child.stdout),
    signal: (signal) => {
      // Windows cannot deliver POSIX signals. Its local helper tests exercise
      // the registered handler; Linux/macOS deliver actual operating-system signals.
      if (process.platform === "win32") child.send({ type: "signal", signal });
      else assert.equal(child.kill(signal), true);
    }
  };
}

async function fixture(t, timeoutMs = 2_000) {
  const source = `
    import { createServer } from 'node:http';
    import { installGracefulShutdown } from ${JSON.stringify(helperUrl)};
    let active;
    const server = createServer((req, res) => {
      if (req.url === '/slow') {
        active = res;
        process.send({type:'request'});
      } else {
        res.end('ok');
      }
    });
    installGracefulShutdown(server, {timeoutMs:${timeoutMs}});
    process.on('message', message => {
      if (message.type === 'finish') active.end('completed');
      if (message.type === 'signal') process.emit(message.signal, message.signal);
    });
    server.listen(0, '127.0.0.1', () => process.send({type:'ready',port:server.address().port}));
  `;
  const child = childProcess(t, ["--input-type=module", "-e", source]);
  const { port } = await child.message("ready");
  return Object.assign(child, { port });
}

function request(port, path = "/", agent = false) {
  const promise = new Promise((resolve, reject) => {
    const req = get({ host: "127.0.0.1", port, path, agent }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; });
      res.once("error", reject);
      res.once("end", () => resolve({ status: res.statusCode, body }));
    });
    req.once("error", reject);
    req.setTimeout(5_000, () => req.destroy(new Error("HTTP request timed out")));
  });
  promise.catch(() => {});
  return promise;
}

for (const signal of ["SIGTERM", "SIGINT"]) {
  test(`${signal} drains an active HTTP request and refuses new connections`, { timeout: 10_000 }, async (t) => {
    const server = await fixture(t);
    const agent = new Agent({ keepAlive: true });
    t.after(() => agent.destroy());
    const active = request(server.port, "/slow", agent);
    await server.message("request");
    server.signal(signal);
    await server.logged(new RegExp(`Received ${signal};`));
    await assert.rejects(request(server.port), { code: "ECONNREFUSED" });
    server.child.send({ type: "finish" });
    assert.deepEqual(await active, { status: 200, body: "completed" });
    assert.deepEqual(await server.exit, { code: 0, signal: null });
  });
}

test("repeated signals do not interrupt an active request", { timeout: 10_000 }, async (t) => {
  const server = await fixture(t);
  const active = request(server.port, "/slow");
  await server.message("request");
  server.signal("SIGTERM");
  await server.logged(/Received SIGTERM;/);
  server.signal("SIGINT");
  await delay(50);
  server.child.send({ type: "finish" });
  assert.deepEqual(await active, { status: 200, body: "completed" });
  assert.deepEqual(await server.exit, { code: 0, signal: null });
  assert.equal((server.output.match(/closing HTTP server/g) ?? []).length, 1);
});

test("a stuck request reaches the shutdown deadline and exits unsuccessfully", { timeout: 10_000 }, async (t) => {
  const server = await fixture(t, 150);
  const active = request(server.port, "/slow");
  await server.message("request");
  server.signal("SIGTERM");
  await server.logged(/Received SIGTERM;/);
  assert.deepEqual(await server.exit, { code: 1, signal: null });
  await assert.rejects(active);
  assert.match(server.output, /Graceful shutdown timed out after 150 ms/);
});

test("idle keep-alive connections do not hold shutdown open", { timeout: 10_000 }, async (t) => {
  const server = await fixture(t);
  const agent = new Agent({ keepAlive: true });
  t.after(() => agent.destroy());
  assert.deepEqual(await request(server.port, "/", agent), { status: 200, body: "ok" });
  server.signal("SIGTERM");
  assert.deepEqual(await server.exit, { code: 0, signal: null });
  assert.doesNotMatch(server.output, /timed out/);
});

for (const signal of ["SIGTERM", "SIGINT"]) {
  test(`production API exits cleanly on ${signal}`, { skip: process.platform === "win32", timeout: 10_000 }, async (t) => {
    const reservation = createServer();
    await new Promise((resolve, reject) => {
      reservation.once("error", reject);
      reservation.listen(0, "127.0.0.1", resolve);
    });
    const port = reservation.address().port;
    await new Promise((resolve) => reservation.close(resolve));
    const server = childProcess(t, [serverFile], {
      PORT: String(port), NODE_ENV: "test", JWT_SECRET: "test-only",
      DATABASE_URL: "", STRIPE_SECRET_KEY: ""
    });
    await server.logged(new RegExp(`API listening on http://localhost:${port}`));
    const healthy = await request(port, "/health");
    assert.equal(healthy.status, 200);
    assert.deepEqual(JSON.parse(healthy.body), { ok: true, service: "api" });
    server.signal(signal);
    assert.deepEqual(await server.exit, { code: 0, signal: null });
  });
}
