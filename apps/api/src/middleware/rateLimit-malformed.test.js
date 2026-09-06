import { malformedJsonPreLimiter } from "./rateLimit.js";

describe("Malformed JSON Rate Limiting Pre-Check (#11592)", () => {
  it("should export malformedJsonPreLimiter middleware", () => {
    expect(malformedJsonPreLimiter).toBeDefined();
    expect(typeof malformedJsonPreLimiter).toBe("function");
  });
});
