const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const ts = require("typescript");

for (const extension of [".ts", ".tsx"]) {
  require.extensions[extension] = (module, filename) => {
    const source = fs.readFileSync(filename, "utf8");
    const output = ts.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022
      },
      fileName: filename
    }).outputText;

    module._compile(output, filename);
  };
}

const FreelancerProfilePage = require(path.join(
  __dirname,
  "../app/freelancers/[username]/page.tsx"
)).default;

function renderFreelancerProfile(username) {
  return renderToStaticMarkup(
    React.createElement(FreelancerProfilePage, { params: { username } })
  );
}

test("renders the matching mock freelancer for a known username", () => {
  const html = renderFreelancerProfile("maya-dev");

  assert.match(html, /maya-dev/);
  assert.match(html, /Next\.js/);
  assert.match(html, /TypeScript/);
  assert.match(html, /\$65\/hr/);
  assert.doesNotMatch(html, /Portfolio, reviews, and active proposals appear here/);
});

test("renders a clear fallback for an unknown username", () => {
  const html = renderFreelancerProfile("missing-user");

  assert.match(html, /Freelancer not found/);
  assert.match(html, /missing-user/);
  assert.doesNotMatch(html, /\$65\/hr/);
});
