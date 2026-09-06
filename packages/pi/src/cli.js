#!/usr/bin/env node

import { computePi, verifyPi } from "./index.js";

const FORMATS = ["plain", "grouped", "json"];
const GROUP_SIZE = 10;
const GROUPS_PER_LINE = 5;
const LABEL_WIDTH = 8;

const USAGE = `Usage: pi <digits> [options]

Print pi to the requested number of decimal places.

Options:
  -f, --format <plain|grouped|json>  output format, default plain
  -v, --verify                       run the verification suite and report
  -h, --help                         show this message

Examples:
  pi 100
  pi 1000 --format grouped
  pi 1000 --verify
`;

main();

function main() {
  const args = process.argv.slice(2);

  if (args.includes("-h") || args.includes("--help")) {
    process.stdout.write(USAGE);
    return;
  }

  if (args.length === 0) {
    fail("a digit count is required");
  }

  let options;
  try {
    options = parseArguments(args);
  } catch (error) {
    fail(error.message);
  }

  let report = null;
  let value;
  try {
    report = options.verify ? verifyPi(options.digits) : null;
    value = report === null ? computePi(options.digits) : report.value;
  } catch (error) {
    process.stderr.write(`pi: ${error.message}\n`);
    process.exit(1);
  }

  process.stdout.write(render(value, report, options));

  if (report !== null && !report.passed) {
    process.exit(1);
  }
}

function parseArguments(args) {
  let digits = null;
  let format = "plain";
  let verify = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "-v" || arg === "--verify") {
      verify = true;
    } else if (arg === "-f" || arg === "--format") {
      index += 1;
      format = args[index];
    } else if (arg.startsWith("--format=")) {
      format = arg.slice("--format=".length);
    } else if (/^-\d/.test(arg)) {
      throw new Error(`digit count must be a non-negative integer, got: ${arg}`);
    } else if (arg.startsWith("-")) {
      throw new Error(`unknown option: ${arg}`);
    } else if (digits !== null) {
      throw new Error("expected a single digit count");
    } else {
      digits = parseDigits(arg);
    }
  }

  if (digits === null) {
    throw new Error("a digit count is required");
  }

  if (!FORMATS.includes(format)) {
    throw new Error(`format must be one of: ${FORMATS.join(", ")}`);
  }

  return { digits, format, verify };
}

function parseDigits(text) {
  if (!/^\d+$/.test(text)) {
    throw new Error(`digit count must be a non-negative integer, got: ${text}`);
  }

  const digits = Number(text);
  if (!Number.isSafeInteger(digits)) {
    throw new Error(`digit count is too large: ${text}`);
  }

  return digits;
}

function render(value, report, options) {
  if (options.format === "json") {
    const payload = report === null ? { digits: options.digits, value } : report;

    return `${JSON.stringify(payload, null, 2)}\n`;
  }

  const body = options.format === "grouped" ? grouped(value) : `${value}\n`;
  if (report === null) {
    return body;
  }

  return `${body}\n${renderChecks(report)}`;
}

// Ten digits to a group, five groups to a line, each line labelled with the
// decimal place it ends on.
function grouped(value) {
  const fraction = value.slice(2);
  if (fraction.length === 0) {
    return `${value}\n`;
  }

  const perLine = GROUP_SIZE * GROUPS_PER_LINE;
  const lines = ["3."];

  for (let start = 0; start < fraction.length; start += perLine) {
    const slice = fraction.slice(start, start + perLine);
    const groups = [];

    for (let at = 0; at < slice.length; at += GROUP_SIZE) {
      groups.push(slice.slice(at, at + GROUP_SIZE));
    }

    const label = String(start + slice.length).padStart(LABEL_WIDTH);
    lines.push(`${label}  ${groups.join(" ")}`);
  }

  return `${lines.join("\n")}\n`;
}

function renderChecks(report) {
  const lines = report.checks.map(
    (check) => `${check.passed ? "pass" : "FAIL"}  ${check.name}: ${check.detail}`
  );

  lines.push(report.passed ? "all checks passed" : "verification failed");

  return `${lines.join("\n")}\n`;
}

function fail(message) {
  process.stderr.write(`pi: ${message}\n\n${USAGE}`);
  process.exit(1);
}
