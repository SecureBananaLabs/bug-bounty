export function readConfig(env = process.env, smoke = false) {
  const integer = (key, fallback, max) => {
    const n = Number(env[key] ?? fallback);
    if (!Number.isInteger(n) || n < 1 || n > max) throw new Error(`${key} must be an integer from 1 to ${max}`);
    return n;
  };
  let target;
  if (env.BENCHMARK_HOST) {
    target = new URL(env.BENCHMARK_HOST);
    if (!["http:", "https:"].includes(target.protocol) || target.username || target.password || target.pathname !== "/" || target.search || target.hash) {
      throw new Error("BENCHMARK_HOST must be an HTTP(S) origin without credentials, path, query or fragment");
    }
    if (env.BENCHMARK_ALLOW_MUTATIONS !== "1") throw new Error("Existing-server benchmarks send writes: set BENCHMARK_ALLOW_MUTATIONS=1 for a disposable target");
    if (!env.BENCHMARK_TOKEN) throw new Error("Existing-server benchmarks require a dedicated BENCHMARK_TOKEN");
  }
  return {
    target, token: env.BENCHMARK_TOKEN,
    requests: integer("BENCHMARK_REQUESTS", smoke ? 10 : 200, 10000),
    concurrency: integer("BENCHMARK_CONCURRENCY", smoke ? 1 : 4, 16),
    timeoutMs: integer("BENCHMARK_TIMEOUT_MS", 5000, 30000)
  };
}
