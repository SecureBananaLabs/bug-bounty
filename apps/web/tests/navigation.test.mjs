import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, "..");
const navigationFile = join(webRoot, "components", "Navigation.tsx");

const staticPageRoutes = [
  "/",
  "/admin",
  "/billing",
  "/dashboard/client",
  "/dashboard/freelancer",
  "/freelancers/search",
  "/jobs",
  "/jobs/post",
  "/messaging",
  "/notifications",
  "/settings"
];

test("primary navigation links every static web page route", async () => {
  const source = await readFile(navigationFile, "utf8");
  const linkedRoutes = new Set([...source.matchAll(/\["([^"]+)",\s*"[^"]+"\]/g)].map((match) => match[1]));

  const missingPages = staticPageRoutes.filter((route) => {
    const pagePath =
      route === "/"
        ? join(webRoot, "app", "page.tsx")
        : join(webRoot, "app", ...route.slice(1).split("/"), "page.tsx");
    return !existsSync(pagePath);
  });

  assert.deepEqual(missingPages, [], "test route list should match existing static pages");

  const missingLinks = staticPageRoutes.filter((route) => !linkedRoutes.has(route));
  assert.deepEqual(missingLinks, [], `missing primary navigation links: ${missingLinks.join(", ")}`);
});
