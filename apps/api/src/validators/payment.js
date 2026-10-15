import { z } from "zod";

// Stripe accepts ISO-4217 codes; keep the list tight rather than accepting
// any three-letter string the client sends.
const CURRENCIES = ["usd", "eur", "gbp", "mxn", "cad", "aud", "jpy"];

// Mirrors the Payment model: amount is a positive Float, jobId is required,
// currency defaults to usd.
export const createPaymentSchema = z
  .object({
    amount: z
      .number({ invalid_type_error: "amount must be a number" })
      .positive("amount must be greater than 0")
      .finite("amount must be a finite number")
      .max(1_000_000, "amount exceeds the maximum allowed value"),
    currency: z.enum(CURRENCIES, {
      errorMap: () => ({ message: `currency must be one of: ${CURRENCIES.join(", ")}` })
    }).default("usd"),
    jobId: z.string().min(1, "jobId is required")
  })
  // Reject unknown keys so the service layer never receives fields the
  // schema does not model (e.g. an injected provider or status).
  .strict();
