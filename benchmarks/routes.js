import { signAccessToken } from "../apps/api/src/utils/jwt.js";

export function discoverExpressRoutes(app) {
  const routes = [];

  for (const layer of app._router?.stack ?? []) {
    if (layer.route) {
      collectRoute(routes, "", layer.route);
      continue;
    }

    if (layer.name === "router" && layer.handle?.stack) {
      const mountPath = parseMountPath(layer.regexp);
      for (const routeLayer of layer.handle.stack) {
        if (routeLayer.route) {
          collectRoute(routes, mountPath, routeLayer.route);
        }
      }
    }
  }

  return routes.sort((a, b) => `${a.method} ${a.path}`.localeCompare(`${b.method} ${b.path}`));
}

function collectRoute(routes, prefix, route) {
  const methods = Object.keys(route.methods)
    .filter((method) => route.methods[method])
    .map((method) => method.toUpperCase());

  for (const method of methods) {
    routes.push({
      method,
      path: normalizePath(`${prefix}${route.path === "/" ? "" : route.path}`)
    });
  }
}

function parseMountPath(regexp) {
  const source = String(regexp);
  const match = source.match(/\\\/api\\\/([a-z-]+)/) ?? source.match(/\\\/([a-z-]+)/);
  if (!match) {
    return "";
  }
  return normalizePath(match[0].replaceAll("\\/", "/").replace(/\\/g, ""));
}

function normalizePath(path) {
  return path.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
}

export function createBenchmarkScenarios(discoveredRoutes) {
  const adminToken = signAccessToken({ sub: "bench_admin", role: "admin" });
  const scenarios = new Map();

  for (const route of discoveredRoutes) {
    const concretePath = route.path.replace(":provider", "github");
    scenarios.set(`${route.method} ${concretePath}`, {
      ...route,
      path: concretePath,
      headers: {},
      body: undefined,
      description: "Auto-discovered route"
    });
  }

  upsert(scenarios, "GET", "/health", { description: "Service health endpoint" });
  upsert(scenarios, "POST", "/api/auth/register", {
    description: "Register realistic client payload",
    json: { email: "bench-client@example.com", password: "benchmark-pass", role: "client" }
  });
  upsert(scenarios, "POST", "/api/auth/login", {
    description: "Login realistic client payload",
    json: { email: "bench-client@example.com", password: "benchmark-pass" }
  });
  upsert(scenarios, "POST", "/api/auth/refresh", { description: "Refresh token route", json: {} });
  upsert(scenarios, "GET", "/api/auth/oauth/github/callback", { description: "OAuth callback route" });
  upsert(scenarios, "POST", "/api/users", {
    description: "Create user payload",
    json: { email: "bench-user@example.com", name: "Benchmark User", role: "client" }
  });
  upsert(scenarios, "POST", "/api/jobs", {
    description: "Create job with realistic schema payload",
    json: {
      title: "Build a secure marketplace dashboard",
      description: "Implement admin-ready marketplace workflow with testing and telemetry.",
      budgetMin: 1200,
      budgetMax: 2800,
      categoryId: "cat_engineering",
      skills: ["node", "react", "security"]
    }
  });
  upsert(scenarios, "POST", "/api/proposals", {
    description: "Create proposal payload",
    json: { jobId: "job_bench", freelancerId: "usr_bench", amount: 1900, coverLetter: "Benchmark proposal" }
  });
  upsert(scenarios, "POST", "/api/payments", {
    description: "Create payment intent payload",
    json: { amount: 1900, currency: "usd", jobId: "job_bench" }
  });
  upsert(scenarios, "POST", "/api/reviews", {
    description: "Create review payload",
    json: { jobId: "job_bench", rating: 5, comment: "Benchmark review" }
  });
  upsert(scenarios, "POST", "/api/messages", {
    description: "Send message payload",
    json: { threadId: "thread_bench", senderId: "usr_bench", body: "Benchmark message" }
  });
  upsert(scenarios, "POST", "/api/notifications", {
    description: "Create notification payload",
    json: { userId: "usr_bench", type: "benchmark", message: "Benchmark notification" }
  });
  upsert(scenarios, "POST", "/api/uploads", {
    description: "Upload small file payload",
    formData: () => {
      const formData = new FormData();
      formData.append("file", new Blob(["benchmark file"], { type: "text/plain" }), "benchmark.txt");
      return formData;
    }
  });
  upsert(scenarios, "GET", "/api/search?q=security", { description: "Search route with query" });
  upsert(scenarios, "GET", "/api/admin/metrics", {
    description: "Admin metrics with benchmark admin token",
    headers: { authorization: `Bearer ${process.env.BENCHMARK_AUTH_TOKEN || adminToken}` }
  });

  return [...scenarios.values()].sort((a, b) => `${a.method} ${a.path}`.localeCompare(`${b.method} ${b.path}`));
}

function upsert(scenarios, method, path, options) {
  scenarios.set(`${method} ${path}`, {
    method,
    path,
    headers: options.headers ?? {},
    json: options.json,
    formData: options.formData,
    description: options.description
  });
}
