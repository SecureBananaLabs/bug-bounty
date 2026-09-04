import { existsSync, readFileSync } from "node:fs";

function parseDotenv(content) {
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const [key, ...parts] = line.split("=");
        return [key.trim(), parts.join("=").trim().replace(/^["']|["']$/g, "")];
      })
  );
}

export function loadBenchmarkEnv(path = ".env.benchmark") {
  if (!existsSync(path)) {
    return {};
  }
  return parseDotenv(readFileSync(path, "utf8"));
}

export function loadBenchmarkConfig({ argv = process.argv.slice(2), env = process.env } = {}) {
  const fileEnv = loadBenchmarkEnv(env.BENCHMARK_ENV_FILE ?? ".env.benchmark");
  const merged = { ...fileEnv, ...env };
  const modeArg = argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg?.split("=")[1] ?? merged.BENCHMARK_RUN_MODE ?? "full";
  const smoke = mode === "smoke";

  return {
    mode,
    targetUrl: merged.BENCHMARK_TARGET_URL || "",
    jwtSecret: merged.JWT_SECRET || "development-secret",
    outputDir: merged.BENCHMARK_OUTPUT_DIR || "benchmarks/results",
    durationSeconds: Number(merged.BENCHMARK_DURATION_SECONDS ?? (smoke ? 1 : 2)),
    connections: Number(merged.BENCHMARK_CONNECTIONS ?? (smoke ? 1 : 4)),
    ttfbSamples: Number(merged.BENCHMARK_TTFB_SAMPLES ?? (smoke ? 1 : 3))
  };
}

export function applyBenchmarkRuntimeEnv(config, env = process.env) {
  env.JWT_SECRET = config.jwtSecret;

  if (!config.targetUrl) {
    env.BENCHMARK_MODE = "true";
  }
}
