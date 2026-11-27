const PROVIDERS = ["github", "google"];
const PROVIDER_SET = new Set(PROVIDERS);

export function supportedOAuthProviders() {
  return [...PROVIDERS];
}

export function isSupportedOAuthProvider(provider) {
  return typeof provider === "string" && PROVIDER_SET.has(provider);
}
