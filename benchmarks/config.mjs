import fs from "node:fs";
import path from "node:path";

const DEFAULTS = {
  full: {
    connections: 4,
    requests: 60,
    timeoutSeconds: 10,
    ttfbSamples: 5
  },
  smoke: {
    connections: 1,
    requests: 8,
    timeoutSeconds: 10,
    ttfbSamples: 2
  }
};

function parseBooleanFlag(argv, flag) {
  return argv.includes(flag);
}

function parsePositiveInteger(value, fallback) {
  if (value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function trimTrailingSlash(value) {
  return value ? value.replace(/\/+$/, "") : "";
}

export function parseEnvFile(contents) {
  const parsed = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }

  return parsed;
}

function loadEnvFile(env) {
  const envFile = env.BENCHMARK_ENV_FILE ?? ".env.benchmark";
  const resolved = path.resolve(process.cwd(), envFile);

  if (!fs.existsSync(resolved)) {
    return {};
  }

  return parseEnvFile(fs.readFileSync(resolved, "utf8"));
}

export function loadBenchmarkConfig(argv = process.argv.slice(2), env = process.env) {
  const fileEnv = loadEnvFile(env);
  const mergedEnv = { ...fileEnv, ...env };
  const smoke = parseBooleanFlag(argv, "--smoke");
  const defaults = smoke ? DEFAULTS.smoke : DEFAULTS.full;
  const requestEnvKey = smoke ? "BENCHMARK_SMOKE_REQUESTS" : "BENCHMARK_REQUESTS";
  const baseUrl = trimTrailingSlash(mergedEnv.BENCHMARK_BASE_URL ?? "");

  return {
    smoke,
    mode: smoke ? "smoke" : "full",
    baseUrl,
    localMode: baseUrl.length === 0,
    connections: parsePositiveInteger(mergedEnv.BENCHMARK_CONNECTIONS, defaults.connections),
    requests: parsePositiveInteger(mergedEnv[requestEnvKey] ?? mergedEnv.BENCHMARK_REQUESTS, defaults.requests),
    timeoutSeconds: parsePositiveInteger(mergedEnv.BENCHMARK_TIMEOUT_SECONDS, defaults.timeoutSeconds),
    ttfbSamples: parsePositiveInteger(mergedEnv.BENCHMARK_TTFB_SAMPLES, defaults.ttfbSamples),
    authToken: mergedEnv.BENCHMARK_AUTH_TOKEN ?? "",
    resultsDir: mergedEnv.BENCHMARK_RESULTS_DIR ?? path.join("benchmarks", "results"),
    thresholdsPath: mergedEnv.BENCHMARK_THRESHOLDS_PATH ?? path.join("benchmarks", "thresholds.json")
  };
}
