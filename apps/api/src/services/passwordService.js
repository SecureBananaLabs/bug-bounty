import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const HASH_ALGORITHM = "scrypt";
const N = 16384;
const r = 8;
const p = 1;
const KEY_LENGTH = 64;
const MAXMEM = 128 * N * r + 1024 * 1024;

function assertPassword(password) {
  if (typeof password !== "string" || password.length === 0) {
    throw new TypeError("Password must be a non-empty string");
  }
}

export async function hashPassword(password) {
  assertPassword(password);

  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, KEY_LENGTH, {
    N,
    r,
    p,
    maxmem: MAXMEM
  });

  return [
    HASH_ALGORITHM,
    N,
    r,
    p,
    salt.toString("hex"),
    Buffer.from(derivedKey).toString("hex")
  ].join("$");
}

export async function verifyPassword(password, encodedHash) {
  if (typeof password !== "string" || typeof encodedHash !== "string") {
    return false;
  }

  const parts = encodedHash.split("$");

  if (parts.length !== 6 || parts[0] !== HASH_ALGORITHM) {
    return false;
  }

  const [, rawN, rawR, rawP, saltHex, expectedHex] = parts;
  const parsedN = Number(rawN);
  const parsedR = Number(rawR);
  const parsedP = Number(rawP);

  if (
    !Number.isSafeInteger(parsedN) ||
    !Number.isSafeInteger(parsedR) ||
    !Number.isSafeInteger(parsedP) ||
    parsedN < 2 ||
    parsedR < 1 ||
    parsedP < 1 ||
    !/^[a-f0-9]{32}$/i.test(saltHex) ||
    !/^[a-f0-9]{128}$/i.test(expectedHex)
  ) {
    return false;
  }

  try {
    const expectedKey = Buffer.from(expectedHex, "hex");
    const actualKey = Buffer.from(
      await scrypt(password, Buffer.from(saltHex, "hex"), expectedKey.length, {
        N: parsedN,
        r: parsedR,
        p: parsedP,
        maxmem: Math.max(128 * parsedN * parsedR + 1024 * 1024, MAXMEM)
      })
    );

    return (
      actualKey.length === expectedKey.length &&
      timingSafeEqual(actualKey, expectedKey)
    );
  } catch {
    return false;
  }
}
