import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const navigationSource = await readFile(
  new URL("../components/Navigation.tsx", import.meta.url),
  "utf8",
);

function readConfiguredLinks() {
  return [...navigationSource.matchAll(/\["([^"]+)",\s*"([^"]+)"\]/g)].map(
    ([, href, label]) => ({ href, label }),
  );
}

test("public navigation omits admin-only routes", () => {
  const links = readConfiguredLinks();

  assert.deepEqual(
    links.map((link) => link.href),
    [
      "/",
      "/jobs",
      "/freelancers/search",
      "/dashboard/client",
      "/dashboard/freelancer",
      "/messaging",
    ],
  );
  assert.equal(links.some((link) => link.href === "/admin"), false);
  assert.equal(links.some((link) => link.label === "Admin"), false);
});
