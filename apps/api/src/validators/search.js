import { z } from "zod";

const searchQuerySchema = z.object({
  q: z.string().max(200).optional().default("")
});

export function parseSearchQuery(query) {
  const parsed = searchQuerySchema.safeParse(query);

  if (!parsed.success) {
    return {
      success: false,
      message: "Search query must be a single string up to 200 characters"
    };
  }

  return {
    success: true,
    query: parsed.data.q
  };
}
