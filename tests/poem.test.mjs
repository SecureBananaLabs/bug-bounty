import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("POEM.md exists and satisfies the project poem requirements", async () => {
  const poem = await readFile(new URL("../POEM.md", import.meta.url), "utf8");

  assert.match(poem, /^# .+/m, "POEM.md must contain a title");

  const body = poem
    .replace(/^# .+\r?\n+/, "")
    .trim();

  const stanzas = body.split(/\r?\n\s*\r?\n/).filter(Boolean);

  assert.ok(
    stanzas.length >= 3,
    `Expected at least 3 stanzas; received ${stanzas.length}`,
  );

  for (const [index, stanza] of stanzas.entries()) {
    const lines = stanza.split(/\r?\n/).filter((line) => line.trim());
    assert.ok(
      lines.length >= 2,
      `Stanza ${index + 1} must contain at least two non-empty lines`,
    );
  }
});
