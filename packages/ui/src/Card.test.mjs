import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { Script } from "node:vm";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);

function loadCard() {
  const source = readFileSync(new URL("./Card.tsx", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  });
  const module = { exports: {} };
  const script = new Script(outputText, { filename: "Card.cjs" });

  script.runInNewContext({
    exports: module.exports,
    module,
    require
  });

  return module.exports.Card;
}

test("Card forwards native section props and merges caller styles", () => {
  const Card = loadCard();
  const markup = renderToStaticMarkup(
    React.createElement(
      Card,
      {
        title: "Profile",
        id: "profile-card",
        className: "featured",
        "aria-label": "Profile card",
        "data-testid": "profile-card",
        style: { marginTop: "4px" }
      },
      "Ready"
    )
  );

  assert.match(markup, /^<section /);
  assert.match(markup, /id="profile-card"/);
  assert.match(markup, /class="featured"/);
  assert.match(markup, /aria-label="Profile card"/);
  assert.match(markup, /data-testid="profile-card"/);
  assert.match(markup, /border:1px solid #ddd/);
  assert.match(markup, /border-radius:8px/);
  assert.match(markup, /padding:1rem/);
  assert.match(markup, /margin-top:4px/);
});
