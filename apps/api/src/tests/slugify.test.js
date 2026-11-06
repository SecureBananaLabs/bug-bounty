import test from "node:test";
import assert from "node:assert/strict";
import { slugify } from "../utils/slugify.js";

test("Deterministic slugify utility suite", async (t) => {
  await t.test("Converts basic titles and phrases into clean URL slugs", () => {
    assert.equal(
      slugify("Senior Fullstack Developer & Designer"),
      "senior-fullstack-developer-designer"
    );
  });

  await t.test("Normalizes unicode diacritics and international accents correctly", () => {
    assert.equal(
      slugify("Développeur Front-End & Über App"),
      "developpeur-front-end-uber-app"
    );
    assert.equal(
      slugify("Café au Lait & Crème Brûlée"),
      "cafe-au-lait-creme-brulee"
    );
  });

  await t.test("Strips invalid URI characters, symbols, and collapses consecutive separators", () => {
    assert.equal(
      slugify("React 18.0! What's new??? #trending"),
      "react-18-0-whats-new-trending"
    );
    assert.equal(
      slugify("crypto / web3 @ $100%"),
      "crypto-web3-100"
    );
  });

  await t.test("Trims leading and trailing hyphens and whitespace", () => {
    assert.equal(
      slugify("   ---Hello World---   "),
      "hello-world"
    );
  });

  await t.test("Supports custom separator option", () => {
    assert.equal(
      slugify("Data Engineering Pipeline", { separator: "_" }),
      "data_engineering_pipeline"
    );
  });

  await t.test("Supports preserving uppercase when lowercase is set to false", () => {
    assert.equal(
      slugify("AWS Cloud Architecture", { lowercase: false }),
      "AWS-Cloud-Architecture"
    );
  });

  await t.test("Handles empty, null, undefined, and numeric inputs safely", () => {
    assert.equal(slugify(""), "");
    assert.equal(slugify(null), "");
    assert.equal(slugify(undefined), "");
    assert.equal(slugify(98765), "98765");
  });
});
