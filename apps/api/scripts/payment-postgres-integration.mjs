import assert from "node:assert/strict";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

// Opt-in only: this script provisions its own empty cluster. It never accepts a
// DATABASE_URL, applies migrations to an existing server, or registers a service.
const projectRoot = fileURLToPath(new URL("../../../", import.meta.url));
const binariesArgument = process.argv.slice(2);
if (binariesArgument.length !== 1 || !path.isAbsolute(binariesArgument[0])) {
  throw new Error("Provide exactly one absolute PostgreSQL bin directory; no database URL is accepted");
}
const binaries = await fs.realpath(binariesArgument[0]);
const suffix = process.platform === "win32" ? ".exe" : "";
const executable = (name) => path.join(binaries, `${name}${suffix}`);
for (const name of ["initdb", "pg_ctl", "postgres", "createdb", "psql"]) {
  assert.equal((await fs.stat(executable(name))).isFile(), true, `Missing PostgreSQL executable: ${name}`);
}

const runId = randomUUID().replaceAll("-", "");
const cacheRoot = path.join(projectRoot, "node_modules", ".cache", "payment-postgres");
await fs.mkdir(cacheRoot, { recursive: true });
const realCacheRoot = await fs.realpath(cacheRoot);
assert.equal(realCacheRoot, path.resolve(cacheRoot), "The proof cache must not redirect outside the checkout");
const runRoot = path.join(realCacheRoot, runId);
await fs.mkdir(runRoot); // No recursive creation or reuse of a previous run.
const dataDirectory = path.join(runRoot, "data");
const passwordFile = path.join(runRoot, "init-password");
const databaseName = `bounty_payment_test_${runId}`;
const databaseUser = "bounty_payment_test";
const databasePassword = randomBytes(32).toString("hex");
const jwtSecret = randomBytes(48).toString("hex");
const port = await unusedLoopbackPort();
const url = `postgresql://${databaseUser}:${databasePassword}@127.0.0.1:${port}/${databaseName}?schema=public&connection_limit=2&connect_timeout=5&pool_timeout=5&sslmode=disable`;
const childEnvironment = { ...process.env };
for (const key of Object.keys(childEnvironment)) {
  if (key.startsWith("PG")) delete childEnvironment[key];
}
Object.assign(childEnvironment, { PGPASSWORD: databasePassword, PGSSLMODE: "disable", DATABASE_URL: url, JWT_SECRET: jwtSecret });
process.env.DATABASE_URL = url;
process.env.JWT_SECRET = jwtSecret;
process.env.NODE_ENV = "test";
delete process.env.STRIPE_SECRET_KEY;
delete childEnvironment.STRIPE_SECRET_KEY;
let serverStarted = false;
let verifiedPostmasterPid;
let apiServer;
let applicationDatabase;
let probe;
let behaviorFailures = 0;
let behaviorSuiteCompleted = false;
const evidence = {
  scope: "Disposable local PostgreSQL authentication and payment-input integration only",
  runId,
  databaseName,
  host: "127.0.0.1",
  port,
  dataDirectory,
  startedAt: new Date().toISOString(),
  stagingVerified: false,
  paymentProviderVerified: false,
  assertions: [],
  status: "running"
};

try {
  await fs.writeFile(passwordFile, `${databasePassword}\n`, { flag: "wx", mode: 0o600 });
  command("initdb", ["-D", dataDirectory, "-U", databaseUser, "--auth=scram-sha-256", `--pwfile=${passwordFile}`, "--encoding=UTF8", "--no-locale"]);
  await fs.unlink(passwordFile);
  evidence.postgresVersion = command("postgres", ["--version"]).trim();
  evidence.postgresBinarySha256 = createHash("sha256").update(await fs.readFile(executable("postgres"))).digest("hex");
  serverStarted = true;
  command("pg_ctl", ["start", "-D", dataDirectory, "-l", path.join(runRoot, "postgres.log"), "-w", "-t", "20", "-o", `-h 127.0.0.1 -p ${port} -c unix_socket_directories= -c shared_buffers=16MB -c max_connections=8 -c max_parallel_workers=0 -c max_wal_size=128MB`]);
  verifiedPostmasterPid = await verifyPostmaster();
  command("psql", connectionArguments("postgres").concat(["-At", "-v", "ON_ERROR_STOP=1", "-c", "SELECT current_setting('data_directory')"]), dataDirectory);
  command("createdb", ["-h", "127.0.0.1", "-p", String(port), "-U", databaseUser, "-T", "template0", "-E", "UTF8", databaseName]);

  const { PrismaClient } = await import("@prisma/client");
  probe = new PrismaClient({ datasources: { db: { url } } });
  await verifyDatabaseIdentity(probe);
  const tables = await probe.$queryRawUnsafe("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
  assert.equal(tables.length, 0, "Refuse to migrate a database that is not empty");
  await probe.$disconnect();
  const prismaCli = path.join(projectRoot, "node_modules", "prisma", "build", "index.js");
  const schema = path.join(projectRoot, "packages", "db", "prisma", "schema.prisma");
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    assert.equal(await verifyPostmaster(), verifiedPostmasterPid);
    command(process.execPath, [prismaCli, "migrate", "deploy", "--schema", schema]);
    evidence.assertions.push(`migrate deploy ${attempt} succeeded`);
  }
  await verifyDatabaseIdentity(probe);
  const migrations = await probe.$queryRawUnsafe('SELECT migration_name, finished_at, rolled_back_at, checksum FROM "_prisma_migrations"');
  assert.equal(migrations.length, 1);
  assert.equal(migrations[0].migration_name, "20260925000000_user_auth");
  assert.ok(migrations[0].finished_at);
  assert.equal(migrations[0].rolled_back_at, null);
  const migrationSql = await fs.readFile(path.join(path.dirname(schema), "migrations", "20260925000000_user_auth", "migration.sql"));
  assert.equal(migrations[0].checksum, createHash("sha256").update(migrationSql).digest("hex"));
  await probe.$disconnect();

  const { connectDb, prisma } = await import("../src/config/db.js");
  const { createApp } = await import("../src/app.js");
  const { signAccessToken } = await import("../src/utils/jwt.js");
  const { verifyPassword } = await import("../src/services/authService.js");
  assert.ok(process.env.DATABASE_URL === url, "Imports must not override the generated database URL");
  assert.ok(process.env.JWT_SECRET === jwtSecret, "Imports must not override the generated JWT secret");
  applicationDatabase = prisma;
  await connectDb();
  await verifyDatabaseIdentity(prisma);
  apiServer = createApp().listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    apiServer.once("listening", resolve);
    apiServer.once("error", reject);
  });
  const baseUrl = `http://127.0.0.1:${apiServer.address().port}`;
  const email = `payment-${runId}@example.test`;
  const syntheticPassword = "synthetic-test-password-123";
  let registered;
  let loginToken;

  await test("real PostgreSQL migration and authenticated payment-input integration", { timeout: 45_000 }, async (t) => {
    await check("registration persists a non-admin user and a verifiable password hash", async () => {
      const response = await request("/api/auth/register", { email, password: syntheticPassword, fullName: "Synthetic Test User" });
      assert.equal(response.status, 201);
      registered = response.body.data;
      assert.equal(registered.role, "client");
      assert.ok(typeof registered.token === "string" && registered.token.length > 0);
      const saved = await prisma.user.findUnique({ where: { email } });
      assert.equal(saved.id, registered.id);
      assert.equal(saved.role, "CLIENT");
      assert.notEqual(saved.passwordHash, syntheticPassword);
      assert.equal(await verifyPassword(syntheticPassword, saved.passwordHash), true);
      assert.equal(response.body.data.passwordHash, undefined);
    });
    await check("login uses the persisted account and rejects invalid credentials", async () => {
      const loggedIn = await request("/api/auth/login", { email: email.toUpperCase(), password: syntheticPassword });
      assert.equal(loggedIn.status, 200);
      assert.equal(loggedIn.body.data.id, registered.id);
      loginToken = loggedIn.body.data.token;
      assert.ok(typeof loginToken === "string" && loginToken.length > 0);
      assert.equal((await request("/api/auth/login", { email, password: "wrong-synthetic-password" })).status, 401);
      assert.equal((await request("/api/auth/login", { email: `missing-${runId}@example.test`, password: syntheticPassword })).status, 401);
    });
    await check("duplicate email and self-assigned admin registration are rejected", async () => {
      assert.equal((await request("/api/auth/register", { email: email.toUpperCase(), password: syntheticPassword, fullName: "Duplicate Test User" })).status, 409);
      assert.equal((await request("/api/auth/register", { email: `admin-${runId}@example.test`, password: syntheticPassword, fullName: "Synthetic Admin", role: "admin" })).status, 400);
      assert.equal(await prisma.user.count(), 1);
    });
    await check("missing, forged, and unknown-user tokens are rejected", async () => {
      assert.equal((await request("/api/payments", { amount: 125 })).status, 401);
      const parts = loginToken.split(".");
      parts[2] = `${parts[2][0] === "a" ? "b" : "a"}${parts[2].slice(1)}`;
      assert.equal((await request("/api/payments", { amount: 125 }, parts.join("."))).status, 401);
      const unknownToken = signAccessToken({ sub: `missing-${runId}`, role: "client" });
      assert.equal((await request("/api/payments", { amount: 125 }, unknownToken)).status, 401);
    });
    await check("persisted-user authentication precedes strict payment input validation", async () => {
      for (const body of [{ amount: 0 }, { amount: -1 }, { amount: "125" }, { amount: null }, { amount: 125, currency: "ZZZ" }, { amount: 125, bankAccount: "synthetic-not-a-real-account" }]) {
        assert.equal((await request("/api/payments", body, loginToken)).status, 400);
      }
      const normalized = await request("/api/payments", { amount: 125, currency: " INR " }, loginToken);
      assert.equal(normalized.status, 201);
      assert.equal(normalized.body.data.amount, 125);
      assert.equal(normalized.body.data.currency, "inr");
      const defaulted = await request("/api/payments", { amount: 50 }, loginToken);
      assert.equal(defaulted.status, 201);
      assert.equal(defaulted.body.data.currency, "usd");
      // The existing service is a placeholder: this does not assert a payment.
    });
    await check("refresh cannot mint tokens and deleted-user tokens stop authenticating", async () => {
      const refresh = await request("/api/auth/refresh");
      assert.equal(refresh.status, 501);
      assert.equal(refresh.body.data, undefined);
      await prisma.user.delete({ where: { id: registered.id } });
      assert.equal((await request("/api/payments", { amount: 125 }, loginToken)).status, 401);
      assert.equal(await prisma.user.count(), 0);
    });
    if (t.signal.aborted) throw new Error("Integration test aborted");
    behaviorSuiteCompleted = true;

    async function check(name, assertions) {
      await t.test(name, async () => {
        try {
          await assertions();
          evidence.assertions.push(name);
        } catch (error) {
          behaviorFailures += 1;
          throw error;
        }
      });
    }

    async function request(route, body, token) {
      const response = await fetch(`${baseUrl}${route}`, {
        method: "POST",
        headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(10_000)
      });
      return { status: response.status, body: await response.json() };
    }
  });
  evidence.status = behaviorSuiteCompleted && behaviorFailures === 0 && evidence.assertions.length === 8 ? "passed" : "failed";
  if (evidence.status === "failed") process.exitCode = 1;
} catch (error) {
  evidence.status = "failed";
  process.exitCode = 1;
  console.error(redact(error?.message ?? "Integration check failed"));
} finally {
  if (apiServer) {
    await cleanupStep("API close", async () => {
      apiServer.closeAllConnections?.();
      await new Promise((resolve, reject) => apiServer.close((error) => error ? reject(error) : resolve()));
    });
  }
  await cleanupStep("Application database disconnect", () => applicationDatabase?.$disconnect());
  await cleanupStep("Probe disconnect", () => probe?.$disconnect());
  if (serverStarted) {
    try {
      const shutdownPid = await verifyPostmaster();
      if (verifiedPostmasterPid !== undefined) {
        assert.equal(shutdownPid, verifiedPostmasterPid);
      }
      // Recheck the live server, including when pg_ctl timed out after starting
      // it. A PID file alone must not authorize stopping another local server.
      command("psql", connectionArguments("postgres").concat(["-At", "-v", "ON_ERROR_STOP=1", "-c", "SELECT current_setting('data_directory')"]), dataDirectory);
      command("pg_ctl", ["stop", "-D", dataDirectory, "-m", "fast", "-w", "-t", "20"]);
      evidence.serverStopped = true;
    } catch (error) {
      evidence.serverStopped = false;
      evidence.status = "failed";
      process.exitCode = 1;
      console.error(`Cluster shutdown requires attention: ${redact(error?.message ?? "unknown error")}`);
    }
  }
  // Retain the exact synthetic cluster/log for review; never recursively delete
  // an uncertain path or guess which server to stop.
  evidence.finishedAt = new Date().toISOString();
  await fs.writeFile(path.join(runRoot, "evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(`Sanitized proof evidence: ${path.join(runRoot, "evidence.json")}`);
}

async function cleanupStep(label, action) {
  let timer;
  try {
    await Promise.race([
      Promise.resolve().then(action),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("Cleanup deadline exceeded")), 5000); })
    ]);
  } catch (error) {
    evidence.status = "failed";
    process.exitCode = 1;
    console.error(`${label} requires attention: ${redact(error?.message ?? "unknown error")}`);
  } finally {
    clearTimeout(timer);
  }
}

function redact(value) {
  return String(value).replaceAll(url, "[temporary database URL]").replaceAll(databasePassword, "[temporary secret]").replaceAll(jwtSecret, "[temporary secret]");
}

function command(name, args, expectedDirectory) {
  const executablePath = path.isAbsolute(name) ? name : executable(name);
  // Windows background PostgreSQL can inherit captured pipes from pg_ctl and
  // keep spawnSync waiting after pg_ctl exits. The server already logs to -l.
  const detachedServer = name === "pg_ctl" && args[0] === "start";
  const result = spawnSync(executablePath, args, { cwd: projectRoot, env: childEnvironment, encoding: "utf8", timeout: 45_000, maxBuffer: 1024 * 1024, windowsHide: true, ...(detachedServer ? { stdio: "ignore" } : {}) });
  if (result.error || result.status !== 0) throw new Error(`${path.basename(executablePath)} failed: ${redact(result.error?.message ?? result.stderr ?? result.stdout).slice(0, 2000)}`);
  if (expectedDirectory) assert.equal(path.resolve(result.stdout.trim()), path.resolve(expectedDirectory), "PostgreSQL server data directory differs from the owned cluster");
  return result.stdout;
}

function connectionArguments(database) {
  return ["-h", "127.0.0.1", "-p", String(port), "-U", databaseUser, "-d", database];
}

async function verifyPostmaster() {
  assert.equal(await fs.realpath(dataDirectory), path.resolve(dataDirectory));
  assert.equal(path.dirname(dataDirectory), runRoot);
  const lines = (await fs.readFile(path.join(dataDirectory, "postmaster.pid"), "utf8")).split(/\r?\n/);
  const pid = Number(lines[0]);
  assert.ok(Number.isSafeInteger(pid) && pid > 0);
  assert.equal(path.resolve(lines[1]), path.resolve(dataDirectory));
  assert.equal(Number(lines[3]), port);
  assert.equal(lines[5], "127.0.0.1");
  process.kill(pid, 0); // Existence check only; never send a termination signal.
  return pid;
}

async function verifyDatabaseIdentity(database) {
  assert.equal(await verifyPostmaster(), verifiedPostmasterPid);
  const [identity] = await database.$queryRawUnsafe("SELECT current_database() AS name, host(inet_server_addr()) AS host, inet_server_port() AS port, current_setting('data_directory') AS directory, current_setting('unix_socket_directories') AS sockets");
  assert.equal(identity.name, databaseName);
  assert.equal(identity.host, "127.0.0.1");
  assert.equal(Number(identity.port), port);
  assert.equal(path.resolve(identity.directory), path.resolve(dataDirectory));
  assert.equal(identity.sockets, "", "Unix-domain socket listeners must be disabled");
}

async function unusedLoopbackPort() {
  const listener = net.createServer();
  await new Promise((resolve, reject) => {
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", resolve);
  });
  const selectedPort = listener.address().port;
  await new Promise((resolve, reject) => listener.close((error) => error ? reject(error) : resolve()));
  return selectedPort;
}
