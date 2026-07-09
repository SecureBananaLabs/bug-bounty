import { sign, verify } from "jsonwebtoken";
const S = process.env.JWT_SECRET || "dev-secret";
export function generateToken(uid: string): string {
  return sign({ sub: uid }, S, { expiresIn: "7d" });
}
export function verifyToken(t: string): { sub: string } | null {
  try { return verify(t, S) as { sub: string }; } catch { return null; }
}