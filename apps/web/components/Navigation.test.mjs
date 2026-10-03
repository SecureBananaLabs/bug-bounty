import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const componentPath = join(dirname(fileURLToPath(import.meta.url)), "Navigation.tsx");

const expectedRoutes = [
  "/",
  "/jobs",
  "/jobs/post",
  "/freelancers/search",
  "/dashboard/client",
  "/dashboard/freelancer",
  "/messaging",
  "/notifications",
  "/billing",
  "/settings",
  "/admin"
];

test("Navigation links to every top-level web app page", async () => {
  const source = await readFile(componentPath, "utf8");

  for (const href of expectedRoutes) {
    assert.match(source, new RegExp(`\\["${href}",\\s*"[^"]+"\\]`));
  }
});
