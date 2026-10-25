import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const context = {
  token: randomBytes(24).toString("hex"),
  password: randomBytes(24).toString("hex"),
  sequence: 17
};

const endpointContracts = [
  ["auth-register", "POST", "/api/auth/register", 201],
  ["auth-login", "POST", "/api/auth/login", 200],
  ["auth-oauth", "GET", "/api/auth/oauth/:provider/callback", 200],
  ["auth-refresh", "POST", "/api/auth/refresh", 200],
  ["users-list", "GET", "/api/users", 200],
  ["users-create", "POST", "/api/users", 201],
  ["jobs-list", "GET", "/api/jobs", 200],
  ["jobs-create", "POST", "/api/jobs", 201],
  ["proposals-list", "GET", "/api/proposals", 200],
  ["proposals-create", "POST", "/api/proposals", 201],
  ["payments-create", "POST", "/api/payments", 201],
  ["reviews-list", "GET", "/api/reviews", 200],
  ["reviews-create", "POST", "/api/reviews", 201],
  ["messages-list", "GET", "/api/messages", 200],
  ["messages-create", "POST", "/api/messages", 201],
  ["notifications-list", "GET", "/api/notifications", 200],
  ["notifications-create", "POST", "/api/notifications", 201],
  ["uploads-create", "POST", "/api/uploads", 201],
  ["search", "GET", "/api/search", 200],
  ["admin-metrics", "GET", "/api/admin/metrics", 200]
];

function jwtFixture(role = "client", sub = "usr_existing") {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub, role, iat: 100, exp: 1000 })}.c2lnbmF0dXJl`;
}

test("benchmark scenario contracts", async (t) => {
  let scenarios;
  await assert.doesNotReject(async () => {
    ({ scenarios } = await import("../scenarios.mjs"));
  }, "the benchmark scenario manifest must exist and be importable");

  const byId = new Map(scenarios.map((scenario) => [scenario.id, scenario]));
  const payload = (id) => JSON.parse(byId.get(id).build(context).body);

  await t.test("contains exactly the 20 ordered endpoint keys without duplicates", () => {
    assert.equal(scenarios.length, 20);
    assert.equal(byId.size, 20);
    assert.equal(new Set(scenarios.map(({ method, route }) => `${method} ${route}`)).size, 20);
    assert.deepEqual(
      scenarios.map(({ id, method, route, expectedStatus }) => [id, method, route, expectedStatus]),
      endpointContracts
    );
    for (const scenario of scenarios) {
      assert.ok(scenario.route.startsWith("/api/"), scenario.id);
      assert.ok(!scenario.route.endsWith("/"), scenario.id);
      assert.ok(!scenario.path.includes(":"), scenario.id);
      assert.ok(scenario.path.startsWith("/api/"), scenario.id);
      assert.equal(typeof scenario.requiresAuth, "boolean", scenario.id);
      assert.ok(scenario.payloadDescription.length > 20, scenario.id);
      assert.equal(typeof scenario.build, "function", scenario.id);
      assert.equal(typeof scenario.validate, "function", scenario.id);
    }
  });

  await t.test("matches every declared /api route in the application", () => {
    const appUrl = new URL("../../apps/api/src/app.js", import.meta.url);
    const app = readFileSync(appUrl, "utf8");
    const routeImports = new Map(
      [...app.matchAll(/import\s*\{\s*(\w+)\s*\}\s*from\s*["'](\.\/routes\/[^"']+)["']/g)]
        .map((match) => [match[1], match[2]])
    );
    const discovered = [];
    for (const [, mount, router] of app.matchAll(/app\.use\(["'](\/api\/[^"']+)["'],\s*(\w+)\)/g)) {
      const routeFile = readFileSync(new URL(routeImports.get(router), appUrl), "utf8");
      for (const [, method, path] of routeFile.matchAll(/\w+\.(get|post|put|patch|delete|options|head)\(["']([^"']+)["']/g)) {
        discovered.push(`${method.toUpperCase()} ${`${mount}${path}`.replace(/\/$/, "")}`);
      }
    }
    assert.equal(discovered.length, 20);
    assert.deepEqual(
      scenarios.map(({ method, route }) => `${method} ${route}`).sort(),
      discovered.sort()
    );
  });

  await t.test("sends credentials only to the current authentication contracts", () => {
    for (const scenario of scenarios) {
      const { headers, body } = scenario.build(context);
      assert.equal(headers.accept, "application/json", scenario.id);
      assert.ok(body === undefined || typeof body === "string" || Buffer.isBuffer(body), scenario.id);
      if (scenario.requiresAuth) {
        assert.equal(scenario.id, "admin-metrics");
        assert.ok(headers.authorization === `Bearer ${context.token}`, "the admin request uses the supplied token");
      } else {
        assert.ok(!Object.hasOwn(headers, "authorization"), scenario.id);
      }
      assert.ok(!String(body).includes(context.token), "bearer tokens must not appear in request bodies");
      if (["auth-register", "auth-login"].includes(scenario.id)) {
        assert.ok(JSON.parse(body).password === context.password, "authentication uses the supplied ephemeral password");
      } else {
        assert.ok(!String(body).includes(context.password), "passwords are limited to register and login bodies");
      }
      if (scenario.method === "GET") assert.equal(body, undefined, scenario.id);
      if (scenario.method === "POST" && scenario.id !== "uploads-create") {
        assert.equal(headers["content-type"], "application/json", scenario.id);
        assert.doesNotThrow(() => JSON.parse(body), scenario.id);
      }
    }
  });

  await t.test("provides schema-compatible, substantial synthetic request data", async () => {
    const { registerSchema, loginSchema } = await import("../../apps/api/src/validators/auth.js");
    const { createJobSchema } = await import("../../apps/api/src/validators/job.js");
    assert.ok(registerSchema.safeParse(payload("auth-register")).success);
    assert.ok(loginSchema.safeParse(payload("auth-login")).success);
    const job = payload("jobs-create");
    assert.ok(createJobSchema.safeParse(job).success);
    assert.ok(job.budgetMin > 0 && job.budgetMax >= job.budgetMin);
    assert.ok(Buffer.byteLength(job.description) >= 900 && Buffer.byteLength(job.description) <= 1400);
    assert.ok(job.skills.length >= 3);
    const proposal = payload("proposals-create");
    assert.ok(Buffer.byteLength(proposal.coverLetter) >= 900 && Buffer.byteLength(proposal.coverLetter) <= 1400);
    assert.ok(proposal.bidAmount >= job.budgetMin && proposal.bidAmount <= job.budgetMax);
    for (const key of ["jobId", "freelancerId", "estDuration"]) assert.ok(proposal[key].length > 3, key);
    const message = payload("messages-create");
    assert.ok(Buffer.byteLength(message.body) >= 220 && Buffer.byteLength(message.body) <= 350);
    assert.notEqual(message.senderId, message.receiverId);
    const user = payload("users-create");
    assert.equal(user.role, "FREELANCER");
    assert.ok(user.fullName.length > 5);
    for (const id of ["auth-register", "auth-login", "users-create"]) {
      assert.ok(payload(id).email.endsWith("@example.invalid"), id);
    }
    assert.notEqual(
      user.email,
      JSON.parse(byId.get("users-create").build({ ...context, sequence: 18 }).body).email
    );
  });

  await t.test("seeds each collection read through its corresponding create operation", () => {
    const listScenarios = scenarios.filter(({ id }) => id.endsWith("-list"));
    assert.equal(listScenarios.length, 6);
    for (const scenario of listScenarios) {
      assert.equal(scenario.seedWith, scenario.id.replace(/-list$/, "-create"));
      const seed = byId.get(scenario.seedWith);
      assert.equal(seed.method, "POST");
      assert.equal(seed.route, scenario.route);
      assert.equal(seed.expectedStatus, 201);
      assert.equal(scenario.validate([]), false, `${scenario.id} must reject an empty collection`);
    }
  });

  const validData = {
    "auth-register": {
      id: "usr_100", email: payload("auth-register").email, role: "client", token: jwtFixture("client", "usr_100")
    },
    "auth-login": { email: payload("auth-login").email, token: jwtFixture() },
    "auth-oauth": { provider: "github", status: "callback-received" },
    "auth-refresh": { token: jwtFixture() },
    "users-create": { id: "usr_100", ...payload("users-create") },
    "jobs-create": { id: "job_100", status: "open", ...payload("jobs-create") },
    "proposals-create": { id: "prp_100", ...payload("proposals-create") },
    "payments-create": { paymentId: "pay_100", amount: 4250, currency: "usd", provider: "stripe" },
    "reviews-create": { id: "rev_100", ...payload("reviews-create") },
    "messages-create": { id: "msg_100", ...payload("messages-create"), sentAt: "2026-10-21T12:00:00.000Z" },
    "notifications-create": { id: "ntf_100", read: false, ...payload("notifications-create") },
    "uploads-create": { filename: "document.txt", status: "uploaded" },
    search: { query: "accessibility dashboard", users: [], jobs: [], freelancers: [] },
    "admin-metrics": { openJobs: 42, activeFreelancers: 185, flaggedAccounts: 3, monthlyVolume: 128900 }
  };
  for (const scenario of scenarios.filter(({ seedWith }) => seedWith)) {
    validData[scenario.id] = [validData[scenario.seedWith]];
  }

  await t.test("accepts meaningful response data for every scenario", () => {
    for (const scenario of scenarios) {
      assert.equal(scenario.validate(validData[scenario.id]), true, scenario.id);
      if (scenario.seedWith) {
        assert.equal(scenario.validate(Array(4).fill(validData[scenario.seedWith])), true, scenario.id);
      }
    }
  });

  await t.test("rejects malformed response data without throwing", () => {
    for (const scenario of scenarios) {
      for (const malformed of [undefined, null, false, true, 0, "", {}, [], { success: true, data: {} }]) {
        assert.equal(scenario.validate(malformed), false, `${scenario.id} rejects malformed data`);
      }
    }
  });

  await t.test("rejects responses with missing or incorrect fixture fields", () => {
    for (const id of ["users-create", "jobs-create", "proposals-create", "reviews-create", "messages-create", "notifications-create"]) {
      const scenario = byId.get(id);
      const good = validData[id];
      for (const key of Object.keys(good)) {
        const missing = { ...good };
        delete missing[key];
        assert.equal(scenario.validate(missing), false, `${id} requires ${key}`);
      }
      const list = byId.get(id.replace(/-create$/, "-list"));
      assert.equal(list.validate([good, { id: "incorrect" }]), false, `${list.id} checks every item`);
    }
    assert.equal(byId.get("jobs-create").validate({ ...validData["jobs-create"], status: "OPEN" }), false);
    assert.equal(byId.get("payments-create").validate({ ...validData["payments-create"], amount: "4250" }), false);
    assert.equal(byId.get("reviews-create").validate({ ...validData["reviews-create"], rating: 0 }), false);
    assert.equal(byId.get("messages-create").validate({ ...validData["messages-create"], sentAt: "yesterday" }), false);
    assert.equal(byId.get("notifications-create").validate({ ...validData["notifications-create"], read: true }), false);
    assert.equal(byId.get("search").validate({ ...validData.search, query: "unrelated" }), false);
    assert.equal(byId.get("search").validate({ ...validData.search, jobs: {} }), false);
    assert.equal(byId.get("admin-metrics").validate({ ...validData["admin-metrics"], openJobs: -1 }), false);
    assert.equal(byId.get("admin-metrics").validate({ ...validData["admin-metrics"], monthlyVolume: Infinity }), false);
  });

  await t.test("checks authentication identity, role claims and nonempty JWT shape", () => {
    for (const id of ["auth-register", "auth-login", "auth-refresh"]) {
      const scenario = byId.get(id);
      for (const token of ["", "token", "a.b.", "a.b.c", jwtFixture("admin")]) {
        assert.equal(scenario.validate({ ...validData[id], token }), false, `${id} rejects invalid tokens or roles`);
      }
      if (id !== "auth-refresh") {
        assert.equal(scenario.validate({ ...validData[id], email: "unrelated@example.invalid" }), false, id);
      }
    }
    assert.equal(byId.get("auth-register").validate({ ...validData["auth-register"], role: "CLIENT" }), false);
    assert.equal(byId.get("auth-oauth").validate({ provider: "other", status: "callback-received" }), false);
    assert.equal(byId.get("auth-oauth").validate({ provider: "github", status: "unverified" }), false);
  });

  await t.test("encodes the full approximately 8 KiB text fixture as a real multipart file", async () => {
    const scenario = byId.get("uploads-create");
    const { headers, body } = scenario.build(context);
    const fixture = readFileSync(new URL("../fixtures/document.txt", import.meta.url));
    assert.ok(fixture.length >= 7 * 1024 && fixture.length <= 9 * 1024);
    assert.ok(fixture.toString("utf8").includes("Synthetic project"));
    assert.ok(Buffer.isBuffer(body));
    assert.match(headers["content-type"], /^multipart\/form-data; boundary=[a-zA-Z0-9-]+$/);
    const request = new Request("http://benchmark.invalid/api/uploads", { method: "POST", headers, body });
    const form = await request.formData();
    assert.deepEqual([...form.keys()], ["file"]);
    const file = form.get("file");
    assert.equal(file.name, "document.txt");
    assert.equal(file.type, "text/plain");
    assert.deepEqual(Buffer.from(await file.arrayBuffer()), fixture);
  });

  await t.test("rejects the actual empty upload HTTP 201 and accepts an uploaded document", async (t) => {
    const { createApp } = await import("../../apps/api/src/app.js");
    const server = createApp().listen(0, "127.0.0.1");
    t.after(() => {
      if (!server.listening) return;
      return new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
        server.closeAllConnections();
      });
    });
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const upload = byId.get("uploads-create");
    const url = `http://127.0.0.1:${server.address().port}${upload.path}`;
    const emptyResponse = await fetch(url, {
      method: upload.method, headers: { "content-type": "application/json" }, body: "{}"
    });
    const emptyEnvelope = await emptyResponse.json();
    assert.equal(emptyResponse.status, 201);
    assert.equal(emptyEnvelope.success, true);
    assert.equal(emptyEnvelope.data.status, "no-file");
    assert.equal(upload.validate(emptyEnvelope.data), false, "HTTP 201 alone is not a successful upload");
    const response = await fetch(url, { method: upload.method, ...upload.build(context) });
    const envelope = await response.json();
    assert.equal(response.status, upload.expectedStatus);
    assert.equal(envelope.success, true);
    assert.equal(upload.validate(envelope.data), true);
    assert.equal(upload.validate({ status: "uploaded", filename: "wrong.txt" }), false);
  });
});
