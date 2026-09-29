import crypto from "node:crypto";
import { promisify } from "node:util";
import { signAccessToken } from "../utils/jwt.js";
import { findUserByEmail, createUser } from "./userService.js";

const scrypt = promisify(crypto.scrypt);

const SCRYPT_KEYLEN = 64;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };

/**
 * Hash a password with scrypt.
 * Stored format: scrypt$<N>$<r>$<p>$<saltHex>$<hashHex>
 */
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = await scrypt(password, salt, SCRYPT_KEYLEN, SCRYPT_PARAMS);
  return [
    "scrypt",
    SCRYPT_PARAMS.N,
    SCRYPT_PARAMS.r,
    SCRYPT_PARAMS.p,
    salt.toString("hex"),
    derived.toString("hex")
  ].join("$");
}

/**
 * Verify a plaintext password against a stored scrypt hash.
 * Returns false for malformed hashes instead of throwing.
 */
export async function verifyPassword(password, stored) {
  if (typeof stored !== "string") return false;

  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, n, r, p, saltHex, hashHex] = parts;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  if (salt.length === 0 || expected.length === 0) return false;

  const derived = await scrypt(password, salt, expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p)
  });

  return crypto.timingSafeEqual(derived, expected);
}

export async function registerUser(payload) {
  // TODO: persist via Prisma once @freelanceflow/db is wired into the api app
  const user = await createUser({
    email: payload.email,
    fullName: payload.fullName ?? payload.email,
    role: payload.role,
    passwordHash: await hashPassword(payload.password)
  });

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function loginUser(payload) {
  const user = await findUserByEmail(payload.email);

  // Compare against a dummy hash when the user is missing so that the
  // response time does not reveal whether the email exists.
  const storedHash = user ? user.passwordHash : DUMMY_HASH;
  const passwordMatches = await verifyPassword(payload.password, storedHash);

  if (!user || !passwordMatches) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }

  return {
    email: user.email,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken() {
  // TODO: rotate refresh tokens against a persisted session record
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}

// A valid scrypt hash of a value nobody can submit, used to keep the
// not-found and wrong-password paths indistinguishable.
const DUMMY_HASH =
  "scrypt$16384$8$1$00000000000000000000000000000000$" +
  "0000000000000000000000000000000000000000000000000000000000000000";
