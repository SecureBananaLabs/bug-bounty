export function validateCreatePayment(payload) {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Invalid payment payload" };
  }
  const { amount, currency = "usd", jobId, transactionId } = payload;
  if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
    return { ok: false, error: "Payment amount must be a positive number greater than zero" };
  }
  if (typeof currency !== "string" || !["usd", "eur", "gbp", "cad", "aud"].includes(currency.toLowerCase().trim())) {
    return { ok: false, error: "Unsupported currency. Allowed: USD, EUR, GBP, CAD, AUD" };
  }
  if (transactionId !== undefined) {
    if (typeof transactionId !== "string" || transactionId.trim().length < 8) {
      return { ok: false, error: "transactionId must be at least 8 characters" };
    }
    if (transactionId.trim().length > 64) {
      return { ok: false, error: "transactionId cannot exceed 64 characters" };
    }
  }
  return {
    ok: true,
    data: {
      amount,
      currency: currency.toLowerCase().trim(),
      jobId: typeof jobId === "string" ? jobId.trim() : undefined,
      transactionId: typeof transactionId === "string" ? transactionId.trim() : undefined
    }
  };
}

