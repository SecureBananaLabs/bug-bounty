export function resolvePort(env = process.env) {
  const configuredPort = env.PORT?.trim();
  return configuredPort || "3000";
}
