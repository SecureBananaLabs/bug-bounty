import assert from "node:assert/strict";
import test from "node:test";
import nextPackage from "next/package.json" with { type: "json" };

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match) throw new Error(`Unsupported semver: ${version}`);
  return match.slice(1).map(Number);
}

function compare(a, b) {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

function inRange(version, minInclusive, maxExclusive) {
  const value = parseVersion(version);
  return compare(value, minInclusive) >= 0 && compare(value, maxExclusive) < 0;
}

test("installed Next.js stays outside the three critical advisory ranges", () => {
  const version = nextPackage.version;

  const criticalAdvisories = [
    {
      id: "GHSA-p293-qw3h-jr36",
      vulnerable: v => inRange(v, [16, 0, 0], [16, 3, 3])
    },
    {
      id: "GHSA-2xp9-vwfh-vxw4",
      vulnerable: v => inRange(v, [16, 0, 0], [16, 3, 3])
    },
    {
      id: "GHSA-vcvr-r3jv-pc5j",
      vulnerable: v => inRange(v, [16, 2, 0], [16, 3, 6])
    }
  ];

  for (const advisory of criticalAdvisories) {
    assert.equal(
      advisory.vulnerable(version),
      false,
      `${version} must not fall inside ${advisory.id}`
    );
  }
});

test("security boundary predicate rejects the last vulnerable patches and accepts fixed patches", () => {
  const cases = [
    ["16.3.2", true, "GHSA-p293-qw3h-jr36"],
    ["16.3.3", false, "GHSA-p293-qw3h-jr36"],
    ["16.3.2", true, "GHSA-2xp9-vwfh-vxw4"],
    ["16.3.3", false, "GHSA-2xp9-vwfh-vxw4"],
    ["16.3.5", true, "GHSA-vcvr-r3jv-pc5j"],
    ["16.3.6", false, "GHSA-vcvr-r3jv-pc5j"]
  ];

  const checks = {
    "GHSA-p293-qw3h-jr36": v => inRange(v, [16, 0, 0], [16, 3, 3]),
    "GHSA-2xp9-vwfh-vxw4": v => inRange(v, [16, 0, 0], [16, 3, 3]),
    "GHSA-vcvr-r3jv-pc5j": v => inRange(v, [16, 2, 0], [16, 3, 6])
  };

  for (const [version, expected, advisory] of cases) {
    assert.equal(checks[advisory](version), expected, `${version} boundary for ${advisory}`);
  }
});
