const ENV_PATH = require.resolve("../config/env");
const FALLBACK_SECRET = "development-secret";

// Re-require config/env with a cold module cache so the module-level guard
// re-evaluates against whatever process.env we set up for each test.
function loadEnvFresh() {
  delete require.cache[ENV_PATH];
  return require(ENV_PATH);
}

describe("config/env - jwtSecret", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.JWT_SECRET;
  });

  afterAll(() => {
    process.env = originalEnv;
    delete require.cache[ENV_PATH];
  });

  describe("production (NODE_ENV=production)", () => {
    it("throws when JWT_SECRET is unset", () => {
      process.env.NODE_ENV = "production";
      delete process.env.JWT_SECRET;
      expect(() => loadEnvFresh()).toThrow(/JWT_SECRET/);
    });

    it("throws when JWT_SECRET is an empty string", () => {
      process.env.NODE_ENV = "production";
      process.env.JWT_SECRET = "";
      expect(() => loadEnvFresh()).toThrow(/JWT_SECRET/);
    });

    it("throws when JWT_SECRET is only whitespace", () => {
      process.env.NODE_ENV = "production";
      process.env.JWT_SECRET = "   ";
      expect(() => loadEnvFresh()).toThrow(/JWT_SECRET/);
    });

    it("uses the provided JWT_SECRET when set", () => {
      process.env.NODE_ENV = "production";
      process.env.JWT_SECRET = "a-strong-production-secret";
      const env = loadEnvFresh();
      expect(env.jwtSecret).toBe("a-strong-production-secret");
    });
  });

  describe("development fallback", () => {
    it("falls back to the development secret when NODE_ENV=development and JWT_SECRET is unset", () => {
      process.env.NODE_ENV = "development";
      delete process.env.JWT_SECRET;
      const env = loadEnvFresh();
      expect(env.jwtSecret).toBe(FALLBACK_SECRET);
    });

    it("falls back to the development secret when NODE_ENV is not set", () => {
      delete process.env.NODE_ENV;
      delete process.env.JWT_SECRET;
      const env = loadEnvFresh();
      expect(env.jwtSecret).toBe(FALLBACK_SECRET);
    });

    it("still respects an explicitly provided JWT_SECRET in development", () => {
      process.env.NODE_ENV = "development";
      process.env.JWT_SECRET = "local-override";
      const env = loadEnvFresh();
      expect(env.jwtSecret).toBe("local-override");
    });
  });
});
