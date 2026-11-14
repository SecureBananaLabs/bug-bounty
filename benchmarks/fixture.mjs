import { createServer } from "node:http";
import { assertScenarioCoverage } from "./coverage.mjs";
import { scenarios } from "./scenarios.mjs";

let server;
let connection;
let stopping;

async function shutdown(exitCode = 0) {
  if (stopping) return stopping;
  stopping = (async () => {
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      });
    }
    // connectDb currently returns a Prisma placeholder, with no open database
    // connection. Close a real client if the service gains one later.
    if (typeof connection?.$disconnect === "function") {
      await connection.$disconnect();
    } else if (typeof connection?.disconnect === "function") {
      await connection.disconnect();
    } else if (typeof connection?.close === "function") {
      await connection.close();
    }
  })();
  try {
    await stopping;
  } catch {
    exitCode = 1;
  }
  if (process.connected) process.disconnect();
  process.exit(exitCode);
}

async function reportFailure(reason) {
  // Never forward raw errors: a driver or library could include configuration
  // or tokens in its error message. These reasons are fixture-owned constants.
  if (process.connected) {
    await new Promise((resolve) => {
      try {
        process.send({ type: "error", error: reason }, () => resolve());
      } catch {
        resolve();
      }
    });
  }
  return shutdown(1);
}

process.once("SIGTERM", () => void shutdown());
process.once("SIGINT", () => void shutdown());
process.once("disconnect", () => void shutdown());
process.once("uncaughtException", () => void reportFailure("Benchmark fixture failed"));
process.once("unhandledRejection", () => void reportFailure("Benchmark fixture failed"));
process.on("message", (message) => {
  if (message === "stop" || message?.type === "stop") void shutdown();
});

async function start() {
  if (!process.send) return reportFailure("Benchmark fixture requires an IPC parent");
  const host = process.env.BENCH_HOST ?? "127.0.0.1";
  const portText = process.env.BENCH_PORT ?? "0";
  const limitText = process.env.BENCH_LIMIT ?? "100000";
  const secret = process.env.JWT_SECRET;

  if (!["127.0.0.1", "localhost", "::1"].includes(host)) {
    return reportFailure("BENCH_HOST must be a loopback host");
  }
  if (!/^\d+$/.test(portText) || Number(portText) > 65535) {
    return reportFailure("BENCH_PORT must be an integer from 0 to 65535");
  }
  if (!/^\d+$/.test(limitText) || Number(limitText) < 1 || Number(limitText) > 100000) {
    return reportFailure("BENCH_LIMIT must be an integer from 1 to 100000");
  }
  if (typeof secret !== "string" || secret.length < 32) {
    return reportFailure("The parent must provide a dedicated JWT_SECRET of at least 32 characters");
  }

  // Set synthetic application configuration before importing its env module.
  // No dotenv loader, external database, Stripe key or inherited app port is used.
  process.env.NODE_ENV = "test";
  process.env.PORT = portText;
  process.env.DATABASE_URL = "";
  process.env.STRIPE_SECRET_KEY = "";

  const [appModule, dbModule, jwtModule, users, jobs, proposals, reviews, messages, notifications] =
    await Promise.all([
      import("../apps/api/src/app.js"),
      import("../apps/api/src/config/db.js"),
      import("../apps/api/src/utils/jwt.js"),
      import("../apps/api/src/services/userService.js"),
      import("../apps/api/src/services/jobService.js"),
      import("../apps/api/src/services/proposalService.js"),
      import("../apps/api/src/services/reviewService.js"),
      import("../apps/api/src/services/messageService.js"),
      import("../apps/api/src/services/notificationService.js")
    ]);

  connection = await dbModule.connectDb();
  const description = "Synthetic benchmark data for a local development API. ".repeat(20);
  const seedRows = 20;
  for (let index = 0; index < seedRows; index += 1) {
    const userId = index === 0 ? "benchmark-user" : `benchmark-user-${index}`;
    await users.createUser({
      id: userId,
      email: `benchmark.user.${index}@example.invalid`,
      fullName: `Synthetic Benchmark User ${index}`,
      passwordHash: "benchmark-placeholder-not-a-real-password-hash",
      role: index === 0 ? "ADMIN" : "FREELANCER",
      bio: description,
      isVerified: false
    });
  }
  for (let index = 0; index < seedRows; index += 1) {
    const userId = index === 0 ? "benchmark-user" : `benchmark-user-${index}`;
    const jobId = `benchmark-job-${index}`;
    await jobs.createJob({
      id: jobId,
      title: `Synthetic benchmark job ${index}`,
      description,
      budgetMin: 100,
      budgetMax: 200,
      clientId: "benchmark-user",
      categoryId: "benchmark-category",
      skills: ["javascript", "testing"]
    });
    await proposals.createProposal({
      id: `benchmark-proposal-${index}`,
      jobId,
      freelancerId: "benchmark-user-1",
      coverLetter: description,
      bidAmount: 150,
      estDuration: "2 weeks"
    });
    await reviews.createReview({
      id: `benchmark-review-${index}`,
      rating: 5,
      comment: description,
      reviewerId: "benchmark-user",
      revieweeId: "benchmark-user-1"
    });
    await messages.sendMessage({
      id: `benchmark-message-${index}`,
      body: description,
      senderId: "benchmark-user",
      receiverId: "benchmark-user-1",
      isRead: false
    });
    await notifications.createNotification({
      id: `benchmark-notification-${index}`,
      userId,
      title: `Synthetic benchmark notification ${index}`,
      body: description,
      read: false
    });
  }

  const token = jwtModule.signAccessToken({ sub: "benchmark-user", role: "admin" });
  const app = appModule.createApp({ rateLimitOptions: { limit: Number(limitText) } });
  assertScenarioCoverage(app, scenarios);
  server = createServer(app);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(Number(portText), host === "localhost" ? "127.0.0.1" : host, () => {
      server.removeListener("error", reject);
      resolve();
    });
  });
  server.on("error", () => void reportFailure("Benchmark fixture server failed"));
  const address = server.address();
  const urlHost = address.family === "IPv6" ? `[${address.address}]` : address.address;
  process.send({ type: "ready", url: `http://${urlHost}:${address.port}`, token, seedRows }, (error) => {
    if (error) void shutdown(1);
  });
}

start().catch(() => void reportFailure("Benchmark fixture startup failed"));
