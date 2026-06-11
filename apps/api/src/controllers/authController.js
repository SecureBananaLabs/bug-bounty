import { z } from 'zod';

// Define a schema for supported OAuth providers
const supportedProviders = ['google', 'github'];

const oauthProviderSchema = z.enum(supportedProviders);

export async function oauthCallback(req, res) {
  try {
    // Validate the provider parameter
    const provider = oauthProviderSchema.parse(req.params.provider);

    return res.json({
      provider,
      status: "callback-received"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid provider',
        status: 'invalid-provider'
      });
    }

    throw error;
  }
}