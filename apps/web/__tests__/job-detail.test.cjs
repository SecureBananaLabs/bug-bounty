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

const JobDetailPage = require(path.join(
  __dirname,
  "../app/jobs/[id]/page.tsx"
)).default;

function renderJobDetail(id) {
  return renderToStaticMarkup(
    React.createElement(JobDetailPage, { params: { id } })
  );
}

test("renders the matching mock job for a known id", () => {
  const html = renderJobDetail("job-101");

  assert.match(html, /Build an AI customer support widget/);
  assert.match(html, /\$1,500/);
  assert.doesNotMatch(html, /Viewing details for/);
});

test("renders a clear fallback for an unknown job id", () => {
  const html = renderJobDetail("job-missing");

  assert.match(html, /Job not found/);
  assert.match(html, /job-missing/);
  assert.doesNotMatch(html, /Responsibilities, milestones/);
});
