import { computePi, computePiWithGuard, defaultGuardDigits } from "../chudnovsky.js";
import { machinPi } from "./machin.js";
import { hexDigitsAt } from "./bbp.js";
import { digitDistribution, CHI_SQUARED_CRITICAL } from "./distribution.js";

// The orchestrator is the only module that knows about both the generator and
// the oracles. The oracles themselves stay independent of it, of the generator
// and of each other, which is what makes their agreement mean anything.

const KNOWN_PREFIX =
  "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679";

const EXTRA_GUARD = 25;
const MACHIN_LIMIT = 1000;
const HEX_PROBES = 5;
const HEX_PROBE_WIDTH = 4;
const DISTRIBUTION_MINIMUM = 100;

export function verifyPi(digits) {
  const value = computePi(digits);
  const checks = [
    knownPrefixCheck(value, digits),
    guardStabilityCheck(value, digits),
    machinCheck(value, digits),
    bbpCheck(value, digits),
    distributionCheck(value)
  ];

  return {
    digits,
    value,
    checks,
    passed: checks.every((check) => check.passed)
  };
}

function knownPrefixCheck(value, digits) {
  const compared = Math.min(digits, KNOWN_PREFIX.length - 2);

  return {
    name: "known prefix",
    passed: truncate(value, compared) === truncate(KNOWN_PREFIX, compared),
    detail: `first ${compared} decimal places against the published constant`
  };
}

// The most common failure in this class of program is a tail contaminated by
// truncation losses that the guard digits did not quite absorb. Recomputing
// with a wider allowance exposes it: a sound guard rule gives identical output.
function guardStabilityCheck(value, digits) {
  const wider = computePiWithGuard(digits, defaultGuardDigits(digits) + EXTRA_GUARD);

  return {
    name: "guard stability",
    passed: wider === value,
    detail: `default guard against default plus ${EXTRA_GUARD}`
  };
}

function machinCheck(value, digits) {
  const compared = Math.min(digits, MACHIN_LIMIT);

  return {
    name: "cross-algorithm agreement",
    passed: machinPi(compared) === truncate(value, compared),
    detail: `Machin's formula over ${compared} decimal places`
  };
}

function bbpCheck(value, digits) {
  const hex = toHex(value, digits);
  const last = hex.length - HEX_PROBE_WIDTH + 1;
  if (last < 1) {
    return {
      name: "bbp spot audit",
      passed: true,
      detail: "skipped, too few digits to probe"
    };
  }

  const positions = probePositions(last);
  const mismatches = positions.filter(
    (position) => hexDigitsAt(position, HEX_PROBE_WIDTH) !== hex.slice(position - 1, position - 1 + HEX_PROBE_WIDTH)
  );

  return {
    name: "bbp spot audit",
    passed: mismatches.length === 0,
    detail: `${positions.length} probes of ${HEX_PROBE_WIDTH} hexadecimal digits, deepest at position ${last}`
  };
}

function distributionCheck(value) {
  const report = digitDistribution(value);
  if (report.total < DISTRIBUTION_MINIMUM) {
    return {
      name: "digit distribution",
      passed: true,
      detail: `skipped, fewer than ${DISTRIBUTION_MINIMUM} digits`
    };
  }

  return {
    name: "digit distribution",
    passed: report.chiSquared <= CHI_SQUARED_CRITICAL,
    detail: `chi-squared ${report.chiSquared.toFixed(3)} over ${report.total} digits, bound ${CHI_SQUARED_CRITICAL}`
  };
}

// Probes spread evenly from the first position to the deepest available, so a
// fault confined to the tail cannot hide between them.
function probePositions(last) {
  const wanted = Math.min(HEX_PROBES, last);
  const positions = [];

  for (let index = 0; index < wanted; index += 1) {
    const position = wanted === 1 ? 1 : 1 + Math.round((index * (last - 1)) / (wanted - 1));
    if (!positions.includes(position)) {
      positions.push(position);
    }
  }

  return positions;
}

// Rebase the decimal output into hexadecimal so the BBP oracle has something
// to be compared against. The width is set by the information available:
// log2(10) bits per decimal digit, four bits per hexadecimal digit, less one
// digit of slack because the decimal value is itself truncated.
function toHex(value, digits) {
  const width = Math.floor((digits * Math.log2(10)) / 4) - 1;
  if (width < 1) {
    return "";
  }

  const fraction = BigInt(value.slice(2));
  const scaled = (fraction * 16n ** BigInt(width)) / 10n ** BigInt(digits);

  return scaled.toString(16).padStart(width, "0");
}

function truncate(value, digits) {
  if (digits === 0) {
    return value.slice(0, 1);
  }

  return value.slice(0, digits + 2);
}
