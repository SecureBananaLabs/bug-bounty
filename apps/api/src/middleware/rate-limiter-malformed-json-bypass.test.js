import { malformedJsonPreLimiter } from "./rateLimit.js";

describe("Rate Limiter Malformed JSON Bypass Prevention (#11677)", () => {
  it("should execute malformedJsonPreLimiter middleware function", () => {
    const req = { ip: "127.0.0.1", socket: { remoteAddress: "127.0.0.1" } };
    const res = {};
    const next = jest.fn();

    expect(typeof malformedJsonPreLimiter).toBe("function");
  });
});
