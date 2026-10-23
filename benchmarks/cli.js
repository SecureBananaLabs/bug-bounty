#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import { join } from "node:path";
import jwt from "jsonwebtoken";
import { endpoints } from "./endpoints.js";
import {
  DEFAULT_ENV_FILE,
  REPO_ROOT,
  RESULTS_DIR,
  THRESHOLDS_FILE,
  loadEnvFile,
  positiveInteger
} from "./lib/env.js";
import { startLocalServer } from "./lib/server.js";
import { evaluateThresholds, loadThresholds } from "./lib/thresholds.js";
import { renderMarkdown } from "./report.js";
import { runSuite } from "./runner.js";

const require = createRequire(import.meta.url);
const autocannonVersion = require("autocannon/package.json").version;

const MODE_DEFAULTS = {
  full: { connections: 50, duration: 10, ttfbSamples: 20 },
  smoke: { connections: 5, duration: 3, ttfbSamples: 10 }
};

function helpText() {
  return `Usage: npm run benchmark -- [options]

Options:
  --smoke                 Low-concurrency CI run (5 connections, 3s per endpoint)
  --connections <n>       Concurrent connections per endpoint
  --duration <seconds>    Duration per endpoint
  --pipelining <n>        HTTP pipelining factor (default: 1)
  --ttfb-samples <n>      Sequential TTFB samples per endpoint
  --base-url <url>        Target API; omit to start a local server
  --filter <text>         Only run endpoints whose "METHOD /route" contains text
  --no-thresholds         Report threshold violations without failing the run
  --help, -h              Show this help

Environment (see benchmarks/.env.benchmark.example):
  BENCHMARK_BASE_URL, BENCHMARK_TOKEN, BENCHMARK_JWT_SECRET,
  BENCHMARK_CONNECTIONS, BENCHMARK_DURATION, BENCHMARK_PIPELINING,
  BENCHMARK_TTFB_SAMPLES`;
}

function parsePositiveInteger(flag, value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flag} expects a positive integer, received "${value}"`);
  }
  return parsed;
}

function parseArgs(argv) {
  const options = { smoke: false, enforceThresholds: true, help: false };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const equals = argument.indexOf("=");
    const flag = equals === -1 ? argument : argument.slice(0, equals);
    const inline = equals === -1 ? undefined : argument.slice(equals + 1);

    const nextValue = () => {
      if (inline !== undefined) return inline;
      const value = argv[index + 1];
      if (value === undefined) throw new Error(`${flag} requires a value`);
      index += 1;
      return value;
    };

    switch (flag) {
      case "--smoke":
        options.smoke = true;
        break;
      case "--no-thresholds":
        options.enforceThresholds = false;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      case "--connections":
        options.connections = parsePositiveInteger(flag, nextValue());
        break;
      case "--duration":
        options.duration = parsePositiveInteger(flag, nextValue());
        break;
      case "--pipelining":
        options.pipelining = parsePositiveInteger(flag, nextValue());
        break;
      case "--ttfb-samples":
        options.ttfbSamples = parsePositiveInteger(flag, nextValue());
        break;
      case "--base-url":
        options.baseUrl = nextValue();
        break;
      case "--filter":
        options.filter = nextValue();
        break;
      default:
        throw new Error(`Unknown option: ${argument}`);
    }
  }

  return options;
}

function isLoopback(baseUrl) {
  const { hostname } = new URL(baseUrl);
  return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname);
}

function normalizeBaseUrl(raw) {
  const trimmed = raw.replace(/\/+$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
}

/** Strip credentials before a target URL is written to reports or logs. */
function redactBaseUrl(baseUrl) {
  const url = new URL(baseUrl);
  url.username = "";
  url.password = "";
  return url.toString().replace(/\/$/, "");
}

function mintToken(secret) {
  return jwt.sign(
    { sub: "usr_benchmark", role: "admin", scope: "benchmark" },
    secret,
    { expiresIn: "1h" }
  );
}

function gitInfo() {
  try {
    const commit = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    const branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();

    return { commit, branch };
  } catch {
    return { commit: null, branch: null };
  }
}

function writeResults(meta, results, thresholds, thresholdReport) {
  const markdown = renderMarkdown({ meta, results, thresholds, thresholdReport });
  const attempted = results.reduce(
    (total, result) => total + result.requests.completed + result.requests.errors + result.requests.timeouts,
    0
  );
  const failed = results.reduce(
    (total, result) => total + result.requests.non2xx + result.requests.errors + result.requests.timeouts,
    0
  );

  const payload = {
    meta,
    summary: {
      endpoints: results.length,
      totalRequests: results.reduce((total, result) => total + result.requests.completed, 0),
      overallErrorRatePct: attempted === 0 ? 0 : Math.round((failed / attempted) * 10000) / 100,
      worstP99: results.reduce(
        (worst, result) =>
          result.latency.p99 !== null && (worst === null || result.latency.p99 > worst.p99)
            ? { key: result.key, p99: result.latency.p99 }
            : worst,
        null
      )
    },
    thresholds: { ...thresholdReport, config: thresholds },
    results
  };

  const stamp = meta.generatedAt.replace(/[:.]/g, "-");
  const basename = `${stamp}-${meta.mode}`;

  mkdirSync(RESULTS_DIR, { recursive: true });
  writeFileSync(join(RESULTS_DIR, `${basename}.json`), `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(join(RESULTS_DIR, `${basename}.md`), markdown);
  writeFileSync(join(RESULTS_DIR, "latest.json"), `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(join(RESULTS_DIR, "latest.md"), markdown);

  return { markdown, jsonPath: join(RESULTS_DIR, `${basename}.json`), mdPath: join(RESULTS_DIR, `${basename}.md`) };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(helpText());
    return;
  }

  const envFile = loadEnvFile();
  if (envFile.loaded) {
    console.log(`Loaded ${envFile.path}`);
  }

  const mode = options.smoke ? "smoke" : "full";
  const defaults = MODE_DEFAULTS[mode];
  const connections =
    options.connections ?? positiveInteger(process.env.BENCHMARK_CONNECTIONS, defaults.connections);
  const duration =
    options.duration ?? positiveInteger(process.env.BENCHMARK_DURATION, defaults.duration);
  const pipelining =
    options.pipelining ?? positiveInteger(process.env.BENCHMARK_PIPELINING, 1);
  const ttfbSamples =
    options.ttfbSamples ?? positiveInteger(process.env.BENCHMARK_TTFB_SAMPLES, defaults.ttfbSamples);

  let selected = endpoints;
  if (options.filter) {
    const needle = options.filter.toLowerCase();
    selected = endpoints.filter((endpoint) => endpoint.key.toLowerCase().includes(needle));
    if (selected.length === 0) {
      throw new Error(`No endpoints match --filter "${options.filter}"`);
    }
  }

  const jwtSecret = process.env.BENCHMARK_JWT_SECRET || "development-secret";
  const requestedBaseUrl = (options.baseUrl ?? process.env.BENCHMARK_BASE_URL ?? "").trim();

  let server = null;
  let baseUrl = requestedBaseUrl ? normalizeBaseUrl(requestedBaseUrl) : "";

  const stopServer = async () => {
    await server?.stop();
    server = null;
  };

  const shutdown = async (signal) => {
    await stopServer();
    console.error(`\nReceived ${signal}; benchmark interrupted.`);
    process.exit(130);
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  try {
    if (!baseUrl) {
      console.log("Starting local API server for benchmarking...");
      server = await startLocalServer({ jwtSecret });
      baseUrl = server.baseUrl;
    }

    let token = (process.env.BENCHMARK_TOKEN ?? "").trim();
    if (!token) {
      if (!isLoopback(baseUrl) && !process.env.BENCHMARK_JWT_SECRET) {
        throw new Error(
          "Auth-protected endpoints need a token for a remote target. " +
            "Set BENCHMARK_TOKEN in benchmarks/.env.benchmark."
        );
      }
      token = mintToken(jwtSecret);
    }

    const thresholds = loadThresholds(THRESHOLDS_FILE);
    const meta = {
      generatedAt: new Date().toISOString(),
      mode,
      baseUrl: redactBaseUrl(baseUrl),
      target: server ? "local" : "remote",
      git: gitInfo(),
      runtime: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        release: os.release(),
        cpuModel: (os.cpus()[0]?.model ?? "unknown").trim(),
        cpuCount: os.cpus().length,
        totalMemoryBytes: os.totalmem()
      },
      tool: { name: "autocannon", version: autocannonVersion },
      config: {
        connections,
        durationSeconds: duration,
        pipelining,
        ttfbSamples
      }
    };

    console.log(
      `Benchmarking ${selected.length} endpoints against ${meta.baseUrl} ` +
        `(${connections} connections, ${duration}s each, pipelining ${pipelining})`
    );

    const results = await runSuite(selected, {
      baseUrl,
      token,
      connections,
      duration,
      pipelining,
      ttfbSamples,
      onEvent(event) {
        if (event.type === "start") {
          process.stdout.write(
            `[${String(event.index + 1).padStart(2)}/${event.total}] ${event.endpoint.key} ... `
          );
          return;
        }

        const { result } = event;
        console.log(
          `${result.requests.completed.toLocaleString("en-US")} req, ` +
            `${result.rps.sustained} req/s avg, p99 ${result.latency.p99 ?? "—"} ms, ` +
            `${result.errorRatePct.toFixed(2)}% errors`
        );
      }
    });

    const thresholdReport = evaluateThresholds(results, thresholds);
    const { markdown, jsonPath, mdPath } = writeResults(meta, results, thresholds, thresholdReport);

    console.log("");
    console.log(markdown);
    console.log(`\nJSON: ${jsonPath}\nMarkdown: ${mdPath}\nLatest: ${join(RESULTS_DIR, "latest.md")}`);

    if (!thresholdReport.passed) {
      console.error("\nRegression gate failed.");
      if (options.enforceThresholds) process.exitCode = 1;
    }
  } finally {
    process.removeListener("SIGINT", shutdown);
    process.removeListener("SIGTERM", shutdown);
    await stopServer();
  }
}

main().catch((error) => {
  console.error(`Benchmark failed: ${error.message}`);
  process.exitCode = 1;
});
