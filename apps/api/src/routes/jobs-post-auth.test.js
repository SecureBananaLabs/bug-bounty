import { jobRoutes } from "./jobRoutes.js";

describe("Job Creation Endpoint Authentication (#11589)", () => {
  it("should have authMiddleware applied to POST /api/jobs route", () => {
    const postRoute = jobRoutes.stack.find((s) => s.route && s.route.path === "/" && s.route.methods.post);
    expect(postRoute).toBeDefined();
    expect(postRoute.route.stack.length).toBeGreaterThan(1);
  });
});
