import { z } from "zod";

const trimmedNonEmptyString = z.string().trim().min(1);

export const createMessageSchema = z.object({
  recipientId: trimmedNonEmptyString,
  body: trimmedNonEmptyString
});
