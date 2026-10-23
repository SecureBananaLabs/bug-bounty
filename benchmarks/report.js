function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function formatNumber(value, suffix = "") {
  return value === null || value === undefined ? "—" : `${value}${suffix}`;
}

function formatHardware(runtime) {
  const memoryGiB = (runtime.totalMemoryBytes / 1024 ** 3).toFixed(1);
  return `${runtime.cpuModel} · ${runtime.cpuCount} cores · ${memoryGiB} GiB RAM`;
}

/**
 * Render the human-readable benchmark summary (also used as the PR body).
 *
 * @param {{
 *   meta: object,
 *   results: object[],
 *   thresholds: object,
 *   thresholdReport: {passed:boolean, violations:object[]}
 * }} report
 */
export function renderMarkdown({ meta, results, thresholds, thresholdReport }) {
  const { runtime, config, git } = meta;
  const lines = [];

  lines.push("# FreelanceFlow API benchmark");
  lines.push("");
  lines.push("| | |");
  lines.push("|---|---|");
  lines.push(`| Generated | ${meta.generatedAt} |`);
  lines.push(`| Mode | ${meta.mode} |`);
  lines.push(`| Target | ${meta.baseUrl} (${meta.target}) |`);
  lines.push(
    `| Commit | ${git.commit ? `${git.commit.slice(0, 12)}${git.branch ? ` (${git.branch})` : ""}` : "unknown"} |`
  );
  lines.push(`| Tool | ${meta.tool.name} ${meta.tool.version} |`);
  lines.push(
    `| Config | ${config.connections} connections · ${config.durationSeconds}s per endpoint · pipelining ${config.pipelining} · ${config.ttfbSamples} TTFB samples |`
  );
  lines.push(`| Runtime | Node ${runtime.node} · ${runtime.platform} ${runtime.arch} |`);
  lines.push(`| Hardware | ${formatHardware(runtime)} |`);
  lines.push("");
  lines.push("## Results");
  lines.push("");
  lines.push(
    "| Endpoint | Auth | Payload | p50 (ms) | p95 (ms) | p99 (ms) | TTFB p50 (ms) | TTFB p95 (ms) | RPS sustained | RPS peak | Error rate |"
  );
  lines.push("|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|");

  for (const result of results) {
    lines.push(
      [
        `\`${result.key}\``,
        result.auth ? "yes" : "no",
        formatBytes(result.payloadBytes),
        formatNumber(result.latency.p50),
        formatNumber(result.latency.p95),
        formatNumber(result.latency.p99),
        formatNumber(result.ttfb.p50),
        formatNumber(result.ttfb.p95),
        formatNumber(result.rps.sustained),
        formatNumber(result.rps.peak),
        `${result.errorRatePct.toFixed(2)}%`
      ].join(" | ")
    );
  }

  lines.push("");
  lines.push("## Regression gate");
  lines.push("");
  lines.push(
    `- Default thresholds: p99 ≤ ${thresholds.default.p99Ms} ms, error rate ≤ ${thresholds.default.errorRatePct}%`
  );

  const overrides = Object.entries(thresholds.endpoints ?? {});
  if (overrides.length > 0) {
    for (const [key, threshold] of overrides) {
      const parts = [];
      if (typeof threshold.p99Ms === "number") parts.push(`p99 ≤ ${threshold.p99Ms} ms`);
      if (typeof threshold.errorRatePct === "number") parts.push(`error rate ≤ ${threshold.errorRatePct}%`);
      lines.push(`- \`${key}\`: ${parts.join(", ")}`);
    }
  }

  lines.push("");
  if (thresholdReport.passed) {
    lines.push("**Status: PASS** — every endpoint is within its latency and error-rate budget.");
  } else {
    lines.push("**Status: FAIL** — the following budgets were exceeded:");
    lines.push("");
    for (const violation of thresholdReport.violations) {
      lines.push(
        `- \`${violation.key}\` ${violation.metric} = ${violation.actual}${violation.unit} (limit ${violation.limit}${violation.unit})`
      );
    }
  }

  lines.push("");
  lines.push("## Methodology");
  lines.push("");
  lines.push(
    "- Latency is measured per response by autocannon and reported from raw samples (p50/p95/p99)."
  );
  lines.push(
    "- Throughput: sustained is the mean requests/second; peak is the busiest one-second sample."
  );
  lines.push(
    "- Error rate counts non-2xx responses, transport errors and timeouts over all attempted requests."
  );
  lines.push(
    "- TTFB is measured on a warm keep-alive connection by a separate sequential probe, so it describes server responsiveness rather than concurrent-load behaviour."
  );
  lines.push(
    "- A local target is started with `RATE_LIMIT_MAX=1000000`; remote targets must allow benchmark traffic or results will reflect throttling."
  );
  lines.push("");

  return lines.join("\n");
}
