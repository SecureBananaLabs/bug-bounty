import { z } from "zod";

const MAX_SEARCH_QUERY_LENGTH = 200;
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/g;

export const searchQuerySchema = z.object({
  q: z
    .preprocess((value) => {
      if (value === undefined) {
        return "";
      }

      if (typeof value !== "string") {
        return value;
      }

      return value.trim().replace(CONTROL_CHARACTERS, "");
    }, z.string().max(MAX_SEARCH_QUERY_LENGTH, `Search query must be ${MAX_SEARCH_QUERY_LENGTH} characters or fewer`))
    .default("")
});
