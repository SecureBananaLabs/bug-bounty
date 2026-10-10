import { z } from "zod";

const nonblankString = z.string().refine((value) => value.trim().length > 0);

export const createMessageSchema = z.object({
  senderId: nonblankString,
  recipientId: nonblankString,
  content: nonblankString
});
