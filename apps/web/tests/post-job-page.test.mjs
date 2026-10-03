import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../app/jobs/post/page.tsx", import.meta.url), "utf8");

test("post job page renders a real job creation form", () => {
  assert.match(source, /<form[\s\S]*action="\/api\/jobs"/);
  assert.match(source, /method="post"/);
  assert.match(source, /name="title"/);
  assert.match(source, /name="description"/);
  assert.match(source, /name="budgetMin"/);
  assert.match(source, /name="budgetMax"/);
  assert.match(source, /name="categoryId"/);
  assert.match(source, /name="skills"/);
});

test("post job page exposes publish and draft actions", () => {
  assert.match(source, /Publish job/);
  assert.match(source, /Save draft/);
  assert.doesNotMatch(source, /Draft title, budget, category, and skill requirements/);
});
