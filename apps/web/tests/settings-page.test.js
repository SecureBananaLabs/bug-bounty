import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const settingsPagePath = resolve(__dirname, "../app/settings/page.tsx");

test("settings page renders expected account controls", async () => {
  const source = await readFile(settingsPagePath, "utf8");

  assert.match(source, /Display name/);
  assert.match(source, /Email/);
  assert.match(source, /Notification preferences/);
  assert.match(source, /Change password/);
  assert.match(source, /readOnly/);
});
