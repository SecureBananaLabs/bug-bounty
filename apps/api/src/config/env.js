<content>
import { z } from 'zod';

const envSchema = z.object({
  JWT_SECRET: z.string().min(32, {
    message: "JWT_SECRET is required and must be at least 32 characters long",
  }),
});

const env = envSchema.parse(process.env);

export { env };
</content>