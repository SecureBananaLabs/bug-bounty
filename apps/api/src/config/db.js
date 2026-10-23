import { env } from "./env.js";

const SUPPORTED_PROTOCOLS = new Set(["postgresql:", "postgres:"]);

let dbState = {
  connected: false,
  driver: "disconnected",
  connectedAt: null
};

export async function connectDb(options = {}) {
  const rawUrl = options.databaseUrl ?? env.databaseUrl ?? "";
  const nodeEnv = options.nodeEnv ?? env.nodeEnv ?? "development";
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

  dbState = {
    connected: true,
    driver: "prisma-postgresql",
    host: parsed.hostname,
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
