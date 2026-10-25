import crypto from "node:crypto";
import {
  signAccessToken,
  signOAuthStateToken,
  signRefreshToken,
  verifyOAuthStateToken,
  verifyRefreshToken
} from "../utils/jwt.js";

const usersByEmail = new Map();
const consumedOAuthStates = new Set();

function createPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(":");
  const actualHash = crypto.scryptSync(password, salt, 64);
  const expectedHash = Buffer.from(hash, "hex");

  if (actualHash.length !== expectedHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(actualHash, expectedHash);
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role
  };
}

function issueAuthTokens(user) {
  return {
    token: signAccessToken({ sub: user.id, role: user.role }),
    refreshToken: signRefreshToken({ sub: user.id, role: user.role })
  };
}

function createAuthResult(user) {
  return {
    ...sanitizeUser(user),
    ...issueAuthTokens(user)
  };
}

export async function registerUser(payload) {
  const email = payload.email.toLowerCase();
  if (usersByEmail.has(email)) {
    throw new Error("User already exists");
  }

  const user = {
    id: `usr_${Date.now()}`,
    email,
    role: payload.role,
    passwordHash: createPasswordHash(payload.password)
  };

  usersByEmail.set(email, user);
  return createAuthResult(user);
}

export async function loginUser(payload) {
  const email = payload.email.toLowerCase();
  const user = usersByEmail.get(email);
  if (!user || !verifyPassword(payload.password, user.passwordHash)) {
    throw new Error("Invalid email or password");
  }

  return createAuthResult(user);
}

export async function refreshToken(token) {
  const payload = verifyRefreshToken(token);
  const user = [...usersByEmail.values()].find((candidate) => candidate.id === payload.sub);
  if (!user) {
    throw new Error("User not found");
  }

  return issueAuthTokens(user);
}

export function createOAuthState(provider) {
  return signOAuthStateToken({
    provider,
    nonce: crypto.randomBytes(16).toString("hex")
  });
}

export async function validateOAuthState(provider, state) {
  if (consumedOAuthStates.has(state)) {
    throw new Error("Invalid OAuth state");
  }

  const payload = verifyOAuthStateToken(state);
  if (payload.provider !== provider) {
    throw new Error("Invalid OAuth state");
  }

  consumedOAuthStates.add(state);
  return { provider: payload.provider };
}
