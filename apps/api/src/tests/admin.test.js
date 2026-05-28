import { createApp } from "../app.js";

let app, server;

beforeAll(() => {
  app = createApp();
  server = app.listen(0);
});

afterAll((done) => {
  server.close(done);
});

function fetchApi(path, opts = {}) {
  const { method = "GET", body, token } = opts;
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  // For testing without real JWT, we use a mock
  return fetch(`http://localhost:${server.address().port}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

function makeAdminToken() {
  // This is a simplified mock — the real auth uses JWT
  return "mock-admin-token";
}

describe("Admin API", () => {
  test("GET /api/admin/metrics returns dashboard data", async () => {
    const res = await fetchApi("/api/admin/metrics", { token: makeAdminToken() });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty("totalUsers");
    expect(data.data).toHaveProperty("openJobs");
    expect(data.data).toHaveProperty("monthlyVolume");
  });
});
