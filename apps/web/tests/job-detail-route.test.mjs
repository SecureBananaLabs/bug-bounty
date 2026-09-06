import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
import { jsx, jsxs } from "react/jsx-runtime";

const webRoot = path.resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);

function transpileModule(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX
    }
  }).outputText;
}

function loadPage() {
  const mockExports = {};
  vm.runInNewContext(transpileModule(path.join(webRoot, "lib", "mock.ts")), {
    exports: mockExports,
    require,
    module: { exports: mockExports }
  });

  const pageExports = {};
  const pageModule = { exports: pageExports };
  vm.runInNewContext(transpileModule(path.join(webRoot, "app", "jobs", "[id]", "page.tsx")), {
    exports: pageExports,
    module: pageModule,
    require: (specifier) => {
      if (specifier === "../../../lib/mock") return mockExports;
      if (specifier === "react/jsx-runtime") return { jsx, jsxs };
      return require(specifier);
    }
  });

  return pageModule.exports.default;
}

function flattenText(value) {
  if (value == null || typeof value === "boolean") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(flattenText).join(" ");
  if (typeof value === "object") return flattenText(value.props?.children);
  return "";
}

test("job detail route renders matching mock job context", () => {
  const JobDetailPage = loadPage();
  const output = JobDetailPage({ params: { id: "job-101" } });
  const text = flattenText(output);

  assert.match(text, /Build an AI customer support widget/);
  assert.match(text, /\$1,500/);
  assert.match(text, /responsive support widget/);
});

test("job detail route renders a clear fallback for unknown jobs", () => {
  const JobDetailPage = loadPage();
  const output = JobDetailPage({ params: { id: "job-missing" } });
  const text = flattenText(output);

  assert.match(text, /Job not found/);
  assert.match(text, /job-missing/);
  assert.doesNotMatch(text, /Budget:/);
});
