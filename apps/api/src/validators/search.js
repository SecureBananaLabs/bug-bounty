import { z } from "zod";

export const SEARCH_QUERY_MAX_LENGTH = 200;

export const searchQuerySchema = z
  .string()
  .trim()
  .max(SEARCH_QUERY_MAX_LENGTH);
