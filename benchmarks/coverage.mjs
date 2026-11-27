import assert from "node:assert/strict";

// Inspect the pinned Express 4 route stack, rather than counting source strings.
export function assertScenarioCoverage(app, scenarios) {
  const registered = [];
  const paths = scenarios.map((s) => new URL(s.path, "http://localhost").pathname);
  function visit(stack, prefix = "") {
    for (const layer of stack) {
      if (layer.route) {
        assert.equal(typeof layer.route.path, "string", "Add explicit coverage support for non-string routes");
        const path = prefix + (layer.route.path === "/" && prefix ? "" : layer.route.path);
        if (path === "/api" || path.startsWith("/api/")) {
          for (const method of Object.keys(layer.route.methods)) registered.push(`${method.toUpperCase()} ${path}`);
        }
      } else if (layer.handle.stack) {
        const candidate = paths.find((path) => path.startsWith(prefix) && layer.regexp.test(path.slice(prefix.length)));
        assert.ok(candidate, `Uncovered router mount ${prefix}${layer.regexp}`);
        const mount = layer.regexp.exec(candidate.slice(prefix.length))[0].replace(/\/$/, "");
        visit(layer.handle.stack, prefix + mount);
      }
    }
  }
  visit(app._router.stack);
  assert.deepEqual(scenarios.map((s) => s.id).sort(), registered.sort(), "Scenario manifest must cover all API routes exactly once");
}
