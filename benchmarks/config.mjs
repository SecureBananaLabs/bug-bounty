export function readConfig(env = process.env) {
  const integer = (key, fallback, min, max) => {
    const value = Number(env[key] ?? fallback);
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new Error(`${key} must be an integer between ${min} and ${max}`);
    }
    return value;
  };
  const host = env.BENCH_HOST ?? "127.0.0.1";
  if (!["127.0.0.1", "::1"].includes(host)) throw new Error("BENCH_HOST must be a literal loopback address");
  return {
    host, port: integer("BENCH_PORT", 0, 0, 65535),
    requests: integer("BENCH_REQUESTS", 1000, 1, 10000),
    warmup: integer("BENCH_WARMUP", 20, 0, 1000),
    concurrency: integer("BENCH_CONCURRENCY", 4, 1, 32),
    timeoutMs: integer("BENCH_TIMEOUT_MS", 5000, 100, 30000)
  };
}
