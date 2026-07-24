const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const WEB_ROOT = path.resolve(__dirname, "..");

function transpileToTemp(sourcePath, tempRoot) {
  const relativePath = path.relative(WEB_ROOT, sourcePath);
  const outputPath = path.join(tempRoot, relativePath).replace(/\.(tsx|ts)$/, ".js");
  const source = fs.readFileSync(sourcePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020
    },
    fileName: sourcePath
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, compiled.outputText);
  return outputPath;
}

function loadProfilePage() {
  const tempRoot = fs.mkdtempSync(path.join(WEB_ROOT, ".tmp-freelancer-profile-route-"));
  transpileToTemp(path.join(WEB_ROOT, "lib", "mock.ts"), tempRoot);
  const pagePath = transpileToTemp(path.join(WEB_ROOT, "app", "freelancers", "[username]", "page.tsx"), tempRoot);
  const Page = require(pagePath).default;
  fs.rmSync(tempRoot, { recursive: true, force: true });
  return Page;
}

function textFromElement(node) {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(textFromElement).join(" ");
  }
  if (node.props) {
    return textFromElement(node.props.children);
  }
  return "";
}

test("known freelancer usernames render matching mock profile details", () => {
  const Page = loadProfilePage();
  const renderedText = textFromElement(Page({ params: { username: "maya-dev" } }));

  assert.match(renderedText, /maya-dev/);
  assert.match(renderedText, /Next\.js/);
  assert.match(renderedText, /TypeScript/);
  assert.match(renderedText, /\$65\/hr/);
});

test("unknown freelancer usernames render a clear not-found fallback", () => {
  const Page = loadProfilePage();
  const renderedText = textFromElement(Page({ params: { username: "missing-user" } }));

  assert.match(renderedText, /Freelancer not found/i);
  assert.match(renderedText, /missing-user/);
  assert.doesNotMatch(renderedText, /Portfolio, reviews, and active proposals appear here/);
});
