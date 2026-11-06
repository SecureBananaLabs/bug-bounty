import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const navigationSource = await readFile(
  new URL("../components/Navigation.tsx", import.meta.url),
  "utf8"
);

const expectedLinks = [
  ['"/"', '"Home"'],
  ['"/jobs"', '"Jobs"'],
  ['"/jobs/post"', '"Post Job"'],
  ['"/freelancers/search"', '"Find Freelancers"'],
  ['"/dashboard/client"', '"Client Dashboard"'],
  ['"/dashboard/freelancer"', '"Freelancer Dashboard"'],
  ['"/messaging"', '"Messaging"'],
  ['"/notifications"', '"Notifications"'],
  ['"/settings"', '"Settings"'],
  ['"/billing"', '"Billing"'],
  ['"/admin"', '"Admin"']
];

test("Navigation exposes every top-level app page", () => {
  for (const [href, label] of expectedLinks) {
    assert.ok(
      navigationSource.includes(`[${href}, ${label}]`),
      `Expected Navigation links to include ${href}`
    );
  }
});
