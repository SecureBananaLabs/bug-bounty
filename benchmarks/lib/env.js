import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const BENCHMARKS_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
export const REPO_ROOT = dirname(BENCHMARKS_DIR);
export const RESULTS_DIR = resolve(BENCHMARKS_DIR, "results");
export const THRESHOLDS_FILE = resolve(BENCHMARKS_DIR, "thresholds.json");
export const DEFAULT_ENV_FILE = resolve(BENCHMARKS_DIR, ".env.benchmark");

/**
 * Minimal .env loader. Existing process.env values win so CLI flags and the
 * shell environment always take precedence over the file.
 *
 * @param {string} [file]
 * @returns {{path:string, loaded:boolean}}
 */
export function loadEnvFile(file = DEFAULT_ENV_FILE) {
  if (!existsSync(file)) {
    return { path: file, loaded: false };
  }

  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    if (!key || key in process.env) continue;

    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }

  return { path: file, loaded: true };
}

/**
 * Parse a positive integer from a string, returning the fallback for
 * missing or invalid values.
 *
 * @param {string|undefined} value
 * @param {number} fallback
 */
export function positiveInteger(value, fallback) {
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
