import jwt from "jsonwebtoken";

export function createBenchmarkToken(secret) {
  return jwt.sign(
    {
      sub: "benchmark_admin",
      role: "admin",
      scope: "benchmark"
    },
    secret,
    { expiresIn: "15m" }
  );
}
