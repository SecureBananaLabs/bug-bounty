import { env } from "./env.js";

const SUPPORTED_PROTOCOLS = new Set(["postgresql:", "postgres:"]);

let dbState = {
  connected: false,
  driver: "disconnected",
  connectedAt: null
};

export async function connectDb(options = {}) {
  const safeOptions = options !== null && typeof options === "object" ? options : {};
  const rawUrl = safeOptions.databaseUrl ?? process.env.DATABASE_URL ?? env.databaseUrl ?? "";
  const nodeEnv = safeOptions.nodeEnv ?? process.env.NODE_ENV ?? env.nodeEnv ?? "development";
  const trimmedUrl = typeof rawUrl === "string" ? rawUrl.trim() : "";

  if (!trimmedUrl) {
    if (nodeEnv === "production") {
      throw new Error("DATABASE_URL is required in production environment");
    }
    dbState = {
      connected: true,
      driver: "in-memory",
      connectedAt: new Date().toISOString()
    };
    return { ...dbState };
  }

  let parsed;
  try {
    parsed = new URL(trimmedUrl);
  } catch {
    throw new Error("Invalid DATABASE_URL format");
  }

  if (!SUPPORTED_PROTOCOLS.has(parsed.protocol)) {
    throw new Error(`Unsupported database protocol: ${parsed.protocol}`);
  }

  if (!parsed.hostname) {
    throw new Error("Invalid DATABASE_URL format: missing database host");
  }

  const dbName = parsed.pathname ? parsed.pathname.replace(/^\/+/, "").trim() : "";
  if (!dbName) {
    throw new Error("Invalid DATABASE_URL format: missing database name");
  }

  if (parsed.port) {
    const portNum = Number(parsed.port);
    if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
      throw new Error("Invalid DATABASE_URL format: invalid port");
    }
  }

  dbState = {
    connected: true,
    driver: "prisma-postgresql",
    host: parsed.hostname,
    database: dbName,
    connectedAt: new Date().toISOString()
  };

  return { ...dbState };
}

export async function disconnectDb() {
  dbState = {
    connected: false,
    driver: "disconnected",
    connectedAt: null
  };
  return { ...dbState };
}

export function getDbStatus() {
  return { ...dbState };
}
