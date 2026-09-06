import { z } from "zod";

const SUPPORTED_PROVIDERS = ["google", "github"];

export const oauthProviderSchema = z.enum(SUPPORTED_PROVIDERS, {
  errorMap: () => ({ message: `Provider must be one of: ${SUPPORTED_PROVIDERS.join(", ")}` })
});

export function isValidProvider(provider) {
  return SUPPORTED_PROVIDERS.includes(provider);
}
