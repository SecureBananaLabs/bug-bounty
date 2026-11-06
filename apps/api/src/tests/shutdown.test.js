import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { request } from "node:http";
import { once } from "node:events";
import { createServer } from "node:net";

async function startServer(t) {
  const reservation = createServer();
  reservation.listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const availablePort = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  const child = spawn(process.execPath, [new URL("../server.js", import.meta.url).pathname], {
    env: { ...process.env, PORT: String(availablePort) },
    stdio: ["ignore", "pipe", "pipe"]
  });
  t.after(() => child.kill("SIGKILL"));
  const exited = once(child, "exit");
  let output = "";
  child.stderr.on("data", () => {});
  const port = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => reject(new Error(`Startup failed: ${code}/${signal}: ${output}`)));
    child.stdout.on("data", (data) => {
      output += data;
      const match = output.match(/localhost:(\d+)/);
      if (match) resolve(Number(match[1]));
    });
  });
  return { child, exited, port };
}

async function pendingRequest(t, port) {
  // The server acknowledges the headers before waiting for the remaining body.
  const req = request({
    host: "127.0.0.1", port, path: "/api/auth/refresh", method: "POST",
    agent: false,
    headers: { "Content-Type": "application/json", "Content-Length": "2", Expect: "100-continue" }
  });
  t.after(() => req.destroy());
  const response = new Promise((resolve, reject) => {
    req.on("error", reject);
    req.on("response", (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => resolve({ status: res.statusCode, body }));
      res.on("error", reject);
    });
  });
  // A signal on the broken server resets this request; retain that rejection for assertions.
  response.catch(() => {});
  const continued = once(req, "continue");
  req.flushHeaders();
  await continued;
  req.write("{");
  return { req, response };
}

for (const signal of ["SIGTERM", "SIGINT"]) {
  test(`${signal} drains an active request, ignores repeated signals, and exits cleanly`, { timeout: 15000 }, async (t) => {
    const { child, exited, port } = await startServer(t);
    const { req, response } = await pendingRequest(t, port);
    child.kill(signal);
    // Allow the signal to be handled while the request is still incomplete.
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(child.exitCode, null);
    assert.equal(child.signalCode, null, "process must wait for the active request");
    child.kill(signal === "SIGTERM" ? "SIGINT" : "SIGTERM");
    req.end("}");
    assert.equal((await response).status, 200);
    assert.deepEqual(await exited, [0, null]);
  });

  test(`${signal} exits cleanly when idle`, { timeout: 5000 }, async (t) => {
    const { child, exited } = await startServer(t);
    child.kill(signal);
    assert.deepEqual(await exited, [0, null]);
  });
}

test("shutdown stops accepting connections and bounds a stalled request", { timeout: 15000 }, async (t) => {
  const { child, exited, port } = await startServer(t);
  const { response } = await pendingRequest(t, port);
  child.kill("SIGTERM");
  await new Promise((resolve) => setTimeout(resolve, 100));
  await assert.rejects(new Promise((resolve, reject) => {
    const req = request({ host: "127.0.0.1", port, agent: false }, resolve);
    req.on("error", reject);
    req.end();
  }), { code: "ECONNREFUSED" });
  assert.deepEqual(await exited, [1, null]);
  await assert.rejects(response);
});
